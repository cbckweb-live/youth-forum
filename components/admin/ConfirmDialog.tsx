"use client";

type Props = {
  /** The main confirmation message (e.g. "Delete this event?"). */
  message: string;
  /** Optional — the name/title of the item being deleted, shown prominently. */
  itemName?: string;
  /** Optional — the entity type label (e.g. "event", "post"). Used in the description. */
  entityLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({ message, itemName, entityLabel, onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-xl dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] w-full max-w-sm p-6">
        {/* Warning icon */}
        <div className="mx-auto mb-4 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <svg className="w-5 h-5 text-red-600 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        </div>

        <p className="text-sm font-medium text-center text-[#231F1E] dark:text-[#e5e5e5] mb-1">
          {message}
        </p>

        {itemName && (
          <p className="text-sm text-center text-[#231F1E]/80 dark:text-gray-300 font-medium truncate max-w-full px-2 mb-1">
            &ldquo;{itemName}&rdquo;
          </p>
        )}

        <p className="text-xs text-center text-[#231F1E]/50 dark:text-gray-400 mb-5">
          This {entityLabel ?? "item"} cannot be recovered once deleted.
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-[#231F1E]/60 dark:text-gray-400 hover:text-[#231F1E] dark:hover:text-[#e5e5e5] bg-gray-100 dark:bg-[#2a2a2a] rounded-lg hover:bg-gray-200 dark:hover:bg-[#3a3a3a] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#1e1e1e]"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c-.84 0-1.673.025-2.5.075V3.75c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25v.325C11.673 4.025 10.84 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
            </svg>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
