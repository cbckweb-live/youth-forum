"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import Image from "next/image";
import ImageCropper from "./ImageCropper";

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
  const [cropFile, setCropFile] = useState<File | null>(null);

  const isImage = accept.includes("image");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected || !selected[0]) {
      onChange(null);
      return;
    }
    if (isImage && !multiple) {
      setCropFile(selected[0]);
    } else {
      onChange(selected);
    }
  };

  const handleCropped = (croppedFile: File | null) => {
    setCropFile(null);
    if (croppedFile) {
      const dt = new DataTransfer();
      dt.items.add(croppedFile);
      onChange(dt.files);
    } else {
      onChange(null);
    }
  };

  const handleCancelCrop = () => {
    setCropFile(null);
  };

  const handleCropExisting = () => {
    if (file && isImage) {
      setCropFile(file);
    }
  };

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : currentUrl), [file, currentUrl]);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);
  const fileCount = multiple && files ? files.length : null;

  return (
    <div
      className="border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-[#6B1F2A] transition-colors cursor-pointer"
      onClick={() => {
        // Prevent cropper interactions from triggering the hidden file input.
        // Only trigger file dialog when the click originates from the wrapper.
        if (document.activeElement && document.activeElement !== inputRef.current) {
          return;
        }
        inputRef.current?.click();
      }}
      onMouseDown={(e) => {
        // If user clicks/drag-selects inside the crop UI overlay, avoid opening file picker.
        // This also prevents ReactCrop pointer events from bubbling to the wrapper.
        const target = e.target as HTMLElement | null;
        if (target?.closest?.("[data-cropper-root='true']")) return;
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={handleChange}
      />

      {isImage && previewUrl && !multiple && (
        <div className="relative mb-3 h-40">
          <Image
            src={previewUrl}
            alt="Preview"
            fill
            unoptimized={file !== null}
            sizes="(max-width: 768px) 100vw, 33vw"
            style={{ objectFit: "cover" }}
            quality={75}
            className="rounded-lg"
          />
          {file && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCropExisting();
              }}
              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white text-xs px-2 py-1 rounded-md transition-colors"
            >
              Crop
            </button>
          )}
        </div>
      )}

      {!isImage && fileCount !== null && files && files[0] && (
        <p className="text-xs text-[#231F1E]/70 mb-2">{files[0].name}</p>
      )}

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

      {cropFile && (
        <ImageCropper
          imageFile={cropFile}
          onCropped={handleCropped}
          onCancel={handleCancelCrop}
        />
      )}
    </div>
  );
}
