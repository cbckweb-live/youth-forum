"use client";

import { useState, useCallback, useMemo } from "react";
import { useAdminCrudSection } from "@/lib/hooks/useAdminCrudSection";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import FileUploadInput from "@/components/admin/FileUploadInput";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { useAdminImageUpload } from "@/lib/hooks/useAdminImageUpload";
import ToastContainer, { showToast } from "@/components/admin/Toast";
import type { CrudSchema, CrudField } from "./types";

/**
 * Automatically render the appropriate form input for a CrudField.
 */
function FormField({
  field,
  value,
  onChange,
  inputCls,
}: {
  field: CrudField;
  value: unknown;
  onChange: (val: unknown) => void;
  inputCls: string;
}) {
  const strValue = (value ?? "") as string | number;

  switch (field.type) {
    case "textarea":
      return (
        <textarea
          placeholder={field.placeholder}
          value={strValue}
          onChange={(e) => onChange(e.target.value)}
          rows={field.rows ?? 4}
          className={inputCls}
        />
      );

    case "number":
      return (
        <input
          type="number"
          placeholder={field.placeholder}
          value={strValue}
          onChange={(e) => {
            const raw = e.target.value;
            onChange(raw === "" ? "" : Number(raw));
          }}
          min={field.min}
          className={inputCls}
        />
      );

    case "date":
      return (
        <input
          type="date"
          value={strValue}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
        />
      );

    case "select":
      return (
        <select
          value={strValue}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
        >
          <option value="">—</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );

    case "checkbox":
      return (
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
          />
          {field.label}
        </label>
      );

    case "radio":
      return (
        <div className="flex gap-4">
          {field.options?.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                checked={String(value) === opt.value}
                onChange={() => onChange(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      );

    case "email":
      return (
        <input
          type="email"
          placeholder={field.placeholder}
          value={strValue}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
        />
      );

    case "richtext":
      return (
        <RichTextEditor
          value={String(value ?? "")}
          onChange={(val) => onChange(val)}
        />
      );

    default:
      return (
        <input
          type="text"
          placeholder={field.placeholder}
          value={strValue}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          className={inputCls}
        />
      );
  }
}

/**
 * Generic CRUD section component.
 *
 * Renders a list of records (with Edit/Delete actions) and a modal form
 * that auto-generates inputs from the schema's field definitions.
 */
export default function GenericCrudSection<
  T extends { id: string },
>({ schema }: { schema: CrudSchema<T> }) {
  const {
    records,
    editingId,
    showModal,
    saving,
    error,
    confirmDeleteId,
    openNew,
    openEdit,
    closeModal: resetModal,
    executeSubmit,
    handleDelete,
    setConfirmDeleteId,
    fetchData,
  } = useAdminCrudSection<T>({
    apiPath: schema.apiPath,
    actionNames: schema.actionNames,
    fetchRecords: schema.fetchRecords,
  });

  const imageUpload = useAdminImageUpload({
    bucket: schema.fileUploadBucket ?? "media",
    folder: schema.fileUploadFolder,
    compress: schema.fileUploadCompress,
  });
  // We only support one image field per schema for now.
  const imageField = schema.fields.find((f) => f.type === "image");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previousImageUrl, setPreviousImageUrl] = useState<string | null>(null);

  // Track the item being deleted so the confirmation dialog can show its title
  const [deleteItemTitle, setDeleteItemTitle] = useState<string | null>(null);

  const [form, setForm] = useState<Record<string, unknown>>(schema.emptyForm());
  const [validationError, setValidationError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  // Memoized form setter that also triggers field-level side effects
  const setFormWithSideEffects = useCallback(
    (fieldName: string, value: unknown) => {
      setForm((prev) => {
        const updated = { ...prev, [fieldName]: value };
        const field = schema.fields.find((f) => f.name === fieldName);
        if (field?.onChangeSideEffect) {
          const sideEffects = field.onChangeSideEffect(value, updated);
          return { ...updated, ...sideEffects };
        }
        return updated;
      });
    },
    [schema.fields],
  );

  const inputCls =
    "w-full border border-gray-300 dark:border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B1F2A] bg-white dark:bg-[#1e1e1e] text-[#231F1E] dark:text-[#e5e5e5]";

  const visibleFields = schema.fields.filter((f) => {
    if (!f.dependsOn) return true;
    return String(form[f.dependsOn.field]) === f.dependsOn.value;
  });

  function handleEditRecord(record: T) {
    openEdit(record);
    const formValues: Record<string, unknown> = {};
    for (const field of schema.fields) {
      const val = (record as unknown as Record<string, unknown>)[field.name];
      formValues[field.name] = val ?? "";
    }
    setForm(formValues);
    if (imageField) {
      setPreviousImageUrl(
        (record as unknown as Record<string, string | null>)[imageField.name] ?? null,
      );
    }
    setImageFile(null);
    setValidationError(null);
  }

  function handleCloseModal() {
    resetModal();
    setForm(schema.emptyForm());
    setPreviousImageUrl(null);
    setImageFile(null);
    setValidationError(null);
    setDeleteItemTitle(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);

    if (schema.validate) {
      const err = schema.validate(form);
      if (err) {
        setValidationError(err);
        return;
      }
    }

    const ok = await executeSubmit(async () => {
      let payload = { ...form };

      if (imageField && imageFile) {
        if (!imageFile.type.startsWith("image/")) {
          throw new Error(`"${imageFile.name}" is not a valid image file.`);
        }
        if (imageFile.size > 20 * 1024 * 1024) {
          throw new Error(`"${imageFile.name}" exceeds 20MB limit.`);
        }
        payload[imageField.name] = await imageUpload.uploadImage(imageFile);
      }

      if (schema.preparePayload) {
        payload = schema.preparePayload(payload);
      }

      const response = await fetch(schema.apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: editingId ? schema.actionNames.update : schema.actionNames.create,
          id: editingId,
          previous_image_url: editingId ? previousImageUrl : null,
          ...payload,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Failed to save ${schema.entityLabel.toLowerCase()}.`);
      }
    });

    if (ok) {
      const label = editingId
        ? `"${(form[titleField?.name ?? ""] as string) || schema.entityLabel.toLowerCase()}"`
        : schema.entityLabel.toLowerCase();
      const action = editingId ? "updated" : "created";
      showToast(`${label} ${action} successfully`);
    }

    setForm(schema.emptyForm());
    setImageFile(null);
  }

  // ── Find the "title" field to display in list rows ──
  const titleField = schema.fields.find(
    (f) => f.name === "title" || f.name === "name",
  );
  const otherFields = schema.fields.filter(
    (f) => f !== titleField && f.type !== "image" && f.type !== "richtext" && f.type !== "checkbox",
  );

  // ── Client-side search & filter ──
  const hasSearch = schema.searchFields && schema.searchFields.length > 0;
  const hasFilters = schema.filterOptions && schema.filterOptions.length > 0;

  const filteredRecords = useMemo(() => {
    let result = records;

    // Text search
    if (searchText && schema.searchFields) {
      const q = searchText.toLowerCase();
      result = result.filter((rec) => {
        const recAny = rec as unknown as Record<string, unknown>;
        return schema.searchFields!.some((field) => {
          const val = recAny[field];
          return typeof val === "string" && val.toLowerCase().includes(q);
        });
      });
    }

    // Filter options
    if (schema.filterOptions) {
      for (const filterOpt of schema.filterOptions) {
        const filterValue = activeFilters[filterOpt.field];
        if (!filterValue) continue;
        result = result.filter((rec) => {
          if (filterOpt.filterFn) {
            return filterOpt.filterFn(filterValue, rec);
          }
          const recAny = rec as unknown as Record<string, unknown>;
          return String(recAny[filterOpt.field] ?? "") === filterValue;
        });
      }
    }

    return result;
  }, [records, searchText, activeFilters, schema.searchFields, schema.filterOptions]);

  const refresh = useCallback(() => fetchData(), [fetchData]);

  // ── Pagination ──
  const PAGE_SIZE = 20;
  const [page, setPage] = useState(1);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE)),
    [filteredRecords.length],
  );

  const safePage = Math.min(page, totalPages);

  const paginatedRecords = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredRecords.slice(start, start + PAGE_SIZE);
  }, [filteredRecords, safePage]);

  return (
    <div className="space-y-6">
      <ToastContainer />

      {/* Toolbar */}
      {!schema.hideToolbar && (
        <div className="flex justify-end">
          <button
            onClick={() => {
              openNew();
              setForm(schema.emptyForm());
              setImageFile(null);
              setValidationError(null);
            }}
            className="bg-[#6B1F2A] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#7d2432] transition-colors"
          >
            + New {schema.entityLabel}
          </button>
        </div>
      )}

      {/* Custom content before list */}
      {schema.renderBeforeList?.({ records })}

      {/* Search & Filter bar */}
      {(hasSearch || hasFilters) && (
        <div className="flex flex-wrap items-center gap-3">
          {hasSearch && (
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#231F1E]/40 dark:text-gray-500 text-sm">🔍</span>
              <input
                type="text"
                placeholder={`Search ${schema.entityLabel.toLowerCase()}s…`}
                value={searchText}
                onChange={(e) => { setSearchText(e.target.value); setPage(1); }}
                className="w-full border border-gray-300 dark:border-[#2a2a2a] rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B1F2A] bg-white dark:bg-[#1e1e1e] text-[#231F1E] dark:text-[#e5e5e5]"
              />
            </div>
          )}
          {hasFilters &&
            schema.filterOptions!.map((filterOpt) => (
              <select
                key={filterOpt.field}
                value={activeFilters[filterOpt.field] ?? ""}
                onChange={(e) => {
                  setActiveFilters((prev) => ({
                    ...prev,
                    [filterOpt.field]: e.target.value,
                  }));
                  setPage(1);
                }}
                className="border border-gray-300 dark:border-[#2a2a2a] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B1F2A] bg-white dark:bg-[#1e1e1e] text-[#231F1E] dark:text-[#e5e5e5]"
              >
                <option value="">{filterOpt.label}: All</option>
                {filterOpt.choices?.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            ))}
        </div>
      )}

      {/* List */}
      {schema.renderList ? (
        schema.renderList({
          records: filteredRecords,
          onEdit: handleEditRecord,
          onDelete: (id, title) => {
            if (title) setDeleteItemTitle(title);
            setConfirmDeleteId(id);
          },
          refresh,
        })
      ) : (
        <div className="space-y-3">
          {filteredRecords.length > 0 ? (
            paginatedRecords.map((record) => {
              const recordAny = record as unknown as Record<string, unknown>;
              const title = titleField ? String(recordAny[titleField.name] ?? "") : record.id;
              const subtitle = schema.formatSubtitle
                ? schema.formatSubtitle(record)
                : otherFields
                    .map((f) => String(recordAny[f.name] ?? ""))
                    .filter(Boolean)
                    .join(" · ");

              return (
                <div
                  key={record.id}
                  className="bg-white dark:bg-[#1e1e1e] shadow-sm dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)] rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-medium text-sm dark:text-[#e5e5e5]">{title}</p>
                    {subtitle && (
                      <p className="text-xs text-[#231F1E]/50 dark:text-gray-400 mt-0.5">
                        {subtitle}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleEditRecord(record)}
                      aria-label={`Edit ${title}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
                    >
                      <svg className="size-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path d="m5.433 13.917 1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                        <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                      </svg>
                      Edit
                    </button>
                    {schema.renderRowActions?.(record, refresh)}
                    <button
                      onClick={() => {
                        setDeleteItemTitle(title);
                        setConfirmDeleteId(record.id);
                      }}
                      aria-label={`Delete ${title}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1"
                    >
                      <svg className="size-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c-.84 0-1.673.025-2.5.075V3.75c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25v.325C11.673 4.025 10.84 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-[#231F1E]/50 dark:text-gray-400">
              {records.length === 0
                ? `No ${schema.entityLabel.toLowerCase()}s yet.`
                : `No ${schema.entityLabel.toLowerCase()}s match your search.`}
            </p>
          )}
        </div>
      )}

      {/* Pagination controls */}
      {filteredRecords.length > PAGE_SIZE && (
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-[#2a2a2a] pt-4">
          <p className="text-xs text-[#231F1E]/50 dark:text-gray-400">
            Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filteredRecords.length)} of {filteredRecords.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              aria-label="Previous page"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 text-[#231F1E]/60 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="size-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
              </svg>
              Prev
            </button>

            {/* Page numbers with ellipsis */}
            {(() => {
              const pages: (number | "ellipsis")[] = [];
              const maxVisible = 5;
              if (totalPages <= maxVisible + 2) {
                for (let i = 1; i <= totalPages; i++) pages.push(i);
              } else {
                pages.push(1);
                const start = Math.max(2, safePage - 1);
                const end = Math.min(totalPages - 1, safePage + 1);
                if (start > 2) pages.push("ellipsis");
                for (let i = start; i <= end; i++) pages.push(i);
                if (end < totalPages - 1) pages.push("ellipsis");
                pages.push(totalPages);
              }
              return pages.map((p, i) =>
                p === "ellipsis" ? (
                  <span key={`e-${i}`} className="px-1 text-xs text-[#231F1E]/30 dark:text-gray-500">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    aria-label={`Page ${p}`}
                    aria-current={p === safePage ? "page" : undefined}
                    className={`min-w-[28px] h-7 rounded-lg text-xs font-medium transition-all duration-200 ${
                      p === safePage
                        ? "bg-[#6B1F2A] text-white"
                        : "text-[#231F1E]/60 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
                    }`}
                  >
                    {p}
                  </button>
                ),
              );
            })()}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              aria-label="Next page"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 text-[#231F1E]/60 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
              <svg className="size-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Delete confirmation */}
      {confirmDeleteId && (
        <ConfirmDialog
          message={`Delete this ${schema.entityLabel.toLowerCase()}?`}
          itemName={deleteItemTitle ?? undefined}
          entityLabel={schema.entityLabel.toLowerCase()}
          onConfirm={async () => {
            const capturedTitle = deleteItemTitle;
            await handleDelete(confirmDeleteId);
            setConfirmDeleteId(null);
            setDeleteItemTitle(null);
            const label = capturedTitle ? `"${capturedTitle}"` : schema.entityLabel.toLowerCase();
            showToast(`${label} deleted successfully`);
          }}
          onCancel={() => {
            setConfirmDeleteId(null);
            setDeleteItemTitle(null);
          }}
        />
      )}

      {/* Modal form — either custom or default */}
      {showModal && (
        schema.renderEditModal ? (
          schema.renderEditModal({
            editingId,
            onClose: handleCloseModal,
            saving,
            error,
          })
        ) : (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-xl dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] w-full max-w-md p-6 max-h-[90vh] overflow-y-auto relative">
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 text-[#231F1E]/40 dark:text-gray-400 hover:text-[#231F1E] dark:hover:text-[#e5e5e5] text-xl leading-none"
                aria-label="Close"
              >
                ✕
              </button>
              <h2 className="font-display text-lg mb-5 dark:text-[#e5e5e5]">
                {editingId ? `Edit ${schema.entityLabel}` : `New ${schema.entityLabel}`}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {visibleFields.map((field) => {
                  if (field.type === "checkbox") {
                    return (
                      <div key={field.name}>
                        <FormField
                          field={field}
                          value={form[field.name] ?? false}
                          onChange={(val) =>
                            setFormWithSideEffects(field.name, val)
                          }
                          inputCls={inputCls}
                        />
                      </div>
                    );
                  }

                  if (field.type === "image") {
                    return (
                      <div key={field.name}>
                        <FileUploadInput
                          accept="image/*"
                          label={`Upload ${field.label}`}
                          file={imageFile}
                          currentUrl={String(form[field.name] ?? "")}
                          progress={imageUpload.uploadProgress}
                          onChange={(files) => setImageFile(files?.[0] || null)}
                          onRemove={
                            form[field.name]
                              ? () => {
                                  setImageFile(null);
                                  setForm({ ...form, [field.name]: null });
                                }
                              : undefined
                          }
                        />
                      </div>
                    );
                  }

                  return (
                    <div key={field.name}>
                      {field.type !== "radio" && (
                        <label className="block text-sm font-medium text-[#231F1E] dark:text-[#e5e5e5] mb-1">
                          {field.label}
                          {field.required && (
                            <span className="text-red-500 ml-0.5">*</span>
                          )}
                        </label>
                      )}
                      <FormField
                        field={field}
                        value={form[field.name] ?? ""}
                        onChange={(val) =>
                          setFormWithSideEffects(field.name, val)
                        }
                        inputCls={inputCls}
                      />
                      {field.helpText && (
                        <p className="text-xs text-[#231F1E]/50 dark:text-gray-400 mt-1">
                          {field.helpText}
                        </p>
                      )}
                    </div>
                  );
                })}

                {/* Custom fields slot */}
                {schema.renderCustomFields?.({
                  form,
                  setForm: (vals) => setForm((prev) => ({ ...prev, ...vals })),
                  editingId,
                  saving,
                })}

                {validationError && (
                  <p className="text-sm text-red-600">{validationError}</p>
                )}
                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-[#6B1F2A] text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-[#7d2432] transition-colors disabled:opacity-60"
                  >
                    {saving
                      ? "Saving..."
                      : editingId
                        ? `Update ${schema.entityLabel}`
                        : `Create ${schema.entityLabel}`}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="text-sm text-[#231F1E]/50 dark:text-gray-400 hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      )}
    </div>
  );
}
