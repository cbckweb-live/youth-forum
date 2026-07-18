/**
 * Generic CRUD module — shared type definitions.
 *
 * Each admin section (Posts, Events, Gallery, Mathetes, Office Bearers, Living Room)
 * becomes a schema declaration rather than a 200–400 line component.
 */

/** Supported field types in the auto-generated form. */
export type CrudFieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "select"
  | "image"
  | "richtext"
  | "checkbox"
  | "radio"
  | "email";

/** A single field definition in a CRUD schema. */
export interface CrudField {
  /** Field key — maps to the form state key and API payload key. */
  name: string;
  /** Human-readable label shown above the input. */
  label: string;
  /** Input type. */
  type: CrudFieldType;
  /** Whether the field is required for form submission. */
  required?: boolean;
  /** Placeholder text inside the input. */
  placeholder?: string;
  /** Help text shown below the input in smaller text. */
  helpText?: string;
  /** For type="number" — minimum value. */
  min?: number;
  /** For type="textarea" — visible rows. */
  rows?: number;
  /** For type="select" or "radio" — available options. */
  options?: { value: string; label: string }[];
  /** Only show this field when another field has a specific value. */
  dependsOn?: { field: string; value: string };
  /**
   * Optional — run side effects when this field's value changes.
   * Receives the new value and current form state, returns updates to merge.
   * Useful for auto-generating slugs from titles.
   */
  onChangeSideEffect?: (
    value: unknown,
    form: Record<string, unknown>,
  ) => Record<string, unknown>;
}

/** Shape of the response from the generic admin API. */
export interface GenericApiResponse<T> {
  data?: T[];
  error?: string;
  insertedRows?: T[];
}

/** Optional client-side image compression config. */
export interface ImageCompressConfig {
  maxDimension?: number;
  quality?: number;
  preferWebp?: boolean;
}

/**
 * Full schema definition for an admin CRUD section.
 *
 * @template T — The record type (must have an `id` string field).
 */
export interface CrudSchema<T extends { id: string }> {
  /** Display title for the section (e.g. "Living Room Episodes"). */
  title: string;
  /** Singular entity label (e.g. "Episode", "Event", "Post"). */
  entityLabel: string;
  /** API endpoint path (e.g. "/api/admin/living-room"). */
  apiPath: string;
  /** Names of the actions sent to the API. */
  actionNames: {
    create: string;
    update: string;
    delete: string;
  };
  /** Function that fetches all records from Supabase. */
  fetchRecords: () => Promise<T[]>;
  /** Field definitions for the auto-generated list row and modal form. */
  fields: CrudField[];
  /** Returns an empty form state object (all keys except `id`). */
  emptyForm: () => Record<string, unknown>;
  /**
   * Optional — Supabase Storage bucket for file uploads.
   * Required if any field has type="image".
   */
  fileUploadBucket?: string;
  /**
   * Optional — subfolder within the bucket for file uploads.
   */
  fileUploadFolder?: string;
  /**
   * Optional — client-side image compression options.
   */
  fileUploadCompress?: ImageCompressConfig;
  /**
   * Optional — format a list row subtitle from a record.
   * Defaults to showing the first non-title field's value.
   */
  formatSubtitle?: (record: T) => string;
  /**
   * Optional — custom validation function.
   * Return a string error message or null if valid.
   */
  validate?: (form: Record<string, unknown>) => string | null;
  /**
   * Optional — render custom form fields after the auto-generated ones.
   * Useful for complex sections like Posts media attachment picker.
   */
  renderCustomFields?: (props: {
    form: Record<string, unknown>;
    setForm: (form: Record<string, unknown>) => void;
    editingId: string | null;
    saving: boolean;
  }) => React.ReactNode;
  /**
   * Optional — render custom actions in each list row (after Edit/Delete).
   * Useful for things like Posts publish toggle.
   */
  renderRowActions?: (record: T, refresh: () => void) => React.ReactNode;
  /**
   * Optional — transform form values before sending to the API.
   * Useful for converting types (e.g. string → number).
   */
  preparePayload?: (form: Record<string, unknown>) => Record<string, unknown>;
  /**
   * Optional — hide the default toolbar ("+ New" button).
   * Useful when using renderBeforeList with a custom upload form.
   */
  hideToolbar?: boolean;
  /**
   * Optional — render custom content above the records list.
   * Useful for bulk upload forms or section headers.
   */
  renderBeforeList?: (props: { records: T[] }) => React.ReactNode;
  /**
   * Optional — field names to search against in the client-side search box.
   * If omitted, no search box is shown.
   */
  searchFields?: string[];
  /**
   * Optional — filter options for a dropdown above the list.
   * Each option filters records by matching the specified field.
   */
  filterOptions?: {
    label: string;
    field: string;
    /** If provided, show a dropdown with these choices (empty = all). */
    choices?: { value: string; label: string }[];
    /** Custom filter function — receives the current filter value and record. */
    filterFn?: (filterValue: string, record: T) => boolean;
  }[];
  /**
   * Optional — completely replace the default list rendering.
   * Useful for grid/card-based layouts like the photo gallery.
   */
  renderList?: (props: {
    records: T[];
    onEdit: (record: T) => void;
    onDelete: (id: string) => void;
    refresh: () => void;
  }) => React.ReactNode;
  /**
   * Optional — replace the default edit/create modal.
   * Useful when the edit form needs custom layout, image preview, or cropping.
   */
  renderEditModal?: (props: {
    editingId: string | null;
    onClose: () => void;
    saving: boolean;
    error: string | null;
  }) => React.ReactNode;
}
