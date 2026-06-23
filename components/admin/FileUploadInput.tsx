"use client";

import { useRef } from "react";

type Props = {
  accept: string;
  label: string;
  file: File | null;
  files?: FileList | null;
  currentUrl?: string | null;
  progress?: number | null;
  multiple?: boolean;
  onChange: (files: FileList | null) => void;
};

export default function FileUploadInput({ accept, label, file, files, currentUrl, progress, multiple, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const previewUrl = file ? URL.createObjectURL(file) : currentUrl;
  const isImage = accept.includes("image");
  const fileCount = multiple && files ? files.length : null;

  return (
    <div
      className="border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-[#6B1F2A] transition-colors cursor-pointer"
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => onChange(e.target.files)}
      />

      {isImage && previewUrl && !multiple ? (
        <img src={previewUrl} alt="Preview" className="w-full max-h-40 object-cover rounded-lg mb-3" />
      ) : null}

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#6B1F2A]/10 flex items-center justify-center shrink-0">
          <span className="text-[#6B1F2A] text-lg">{isImage ? "🖼" : "📄"}</span>
        </div>
        <div>
          <p className="text-sm font-medium text-[#231F1E]">
            {fileCount !== null
              ? `${fileCount} photo${fileCount !== 1 ? "s" : ""} selected`
              : file
              ? file.name
              : label}
          </p>
          <p className="text-xs text-[#231F1E]/50">Click to {file || fileCount ? "change" : "browse"}</p>
        </div>
      </div>

      {/* Progress bar */}
      {progress !== null && progress !== undefined && progress > 0 && progress < 100 && (
        <div className="mt-3">
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#6B1F2A] rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-[#231F1E]/50 mt-1">{progress}% uploaded</p>
        </div>
      )}
      {progress === 100 && (
        <p className="text-xs text-green-600 mt-2">✓ Upload complete</p>
      )}
    </div>
  );
}
