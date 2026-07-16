"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type ActionNames = {
  create: string;
  update: string;
  delete: string;
};

type UseAdminCrudSectionOptions<T> = {
  /** Callback that fetches records — called on mount and after each mutation. */
  fetchRecords: () => Promise<T[]>;
  /** Base API path (e.g. "/api/admin/living-room"). */
  apiPath: string;
  /** Action names sent to the API (e.g. { create, update, delete }). */
  actionNames: ActionNames;
  /** Error handler called when fetchRecords rejects. */
  onFetchError?: (err: unknown) => string;
};

/**
 * Logic-only CRUD state machine hook.
 *
 * Manages: `records`, `saving`, `error`, `editingId`, `showModal`, `confirmDeleteId`
 * Provides: `executeSubmit(action)` for wrapping submits in try/catch/close/refetch,
 * `handleDelete(id)` for delete requests, `closeModal()` for resetting state,
 * `fetchData()` for re-fetching, and `openNew()` / `openEdit(record, formBuilder)` helpers.
 *
 * Each section still writes its own JSX and form state. This hook only
 * extracts the repetition around saving/error/modal/delete lifecycle.
 */
export function useAdminCrudSection<T extends { id: string }>(
  options: UseAdminCrudSectionOptions<T>,
) {
  const { fetchRecords: fetchRecordsProp, apiPath, actionNames, onFetchError } = options;
  const fetchRecordsRef = useRef(fetchRecordsProp);
  fetchRecordsRef.current = fetchRecordsProp;

  const [records, setRecords] = useState<T[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const mountedRef = useRef(false);

  const fetchData = useCallback(async () => {
    try {
      const data = await fetchRecordsRef.current();
      if (mountedRef.current) {
        setRecords(data);
        setError(null);
      }
    } catch (err) {
      const msg = onFetchError ? onFetchError(err) : err instanceof Error ? err.message : "Failed to load data.";
      if (mountedRef.current) {
        setError(msg);
        setRecords([]);
      }
    }
  }, [onFetchError]);

  useEffect(() => {
    mountedRef.current = true;
    const id = window.setTimeout(() => {
      void fetchData();
    }, 0);
    return () => {
      mountedRef.current = false;
      window.clearTimeout(id);
    };
  }, [fetchData]);

  /**
   * Opens the modal to create a new record. The section still sets its own form state.
   */
  function openNew() {
    setEditingId(null);
    setError(null);
    setShowModal(true);
  }

  /**
   * Opens the modal to edit a record. Pass back the record data so the section
   * can populate its form state from it.
   */
  function openEdit(record: T) {
    setEditingId(record.id);
    setError(null);
    setShowModal(true);
    return record;
  }

  /**
   * Resets all modal and form-related state. The section also resets its own
   * form/image state in a parallel `closeModal` override.
   */
  function closeModal() {
    setEditingId(null);
    setError(null);
    setShowModal(false);
    setConfirmDeleteId(null);
  }

  /**
   * Wraps a submit action with the shared try/catch/saving/error/close/refetch lifecycle.
   *
   * Usage inside a section's `handleSubmit`:
   * ```
   * async function handleSubmit(e: React.FormEvent) {
   *   e.preventDefault();
   *   await executeSubmit(async () => {
   *     // upload images, build payload, POST to API, handle errors
   *   });
   * }
   * ```
   */
  async function executeSubmit(action: () => Promise<void>) {
    setSaving(true);
    setError(null);
    try {
      await action();
      closeModal();
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  }

  /**
   * Sends a delete request to the API. Expects the action payload to be
   * `{ action: actionNames.delete, id }`.
   */
  async function handleDelete(id: string) {
    try {
      const response = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionNames.delete, id }),
      });
      if (!response.ok) {
        const text = await response.text();
        setError(text || "Failed to delete.");
        return;
      }
      setConfirmDeleteId(null);
      void fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete.");
    }
  }

  return {
    // State
    records,
    editingId,
    showModal,
    saving,
    error,
    confirmDeleteId,
    // Setters (for section-specific extensions)
    setEditingId,
    setShowModal,
    setSaving,
    setError,
    setConfirmDeleteId,
    setRecords,
    // Handlers
    openNew,
    openEdit,
    closeModal,
    executeSubmit,
    handleDelete,
    fetchData,
  };
}
