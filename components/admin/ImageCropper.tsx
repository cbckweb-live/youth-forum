"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import Image from "next/image";

type Props = {
  imageFile: File;
  onCropped: (croppedFile: File) => void;
  onCancel: () => void;
};

export default function ImageCropper({ imageFile, onCropped, onCancel }: Props) {
  const [crop, setCrop] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const imageUrl = useMemo(() => URL.createObjectURL(imageFile), [imageFile]);

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  const getRelativePos = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(clientX - rect.left, rect.width)),
      y: Math.max(0, Math.min(clientY - rect.top, rect.height)),
    };
  }, []);

  const handlePointerDown = useCallback((clientX: number, clientY: number) => {
    if (!imageLoaded) return;
    const pos = getRelativePos(clientX, clientY);
    setDragging(true);
    setDragStart(pos);
    setDragCurrent(pos);
    setCrop(null);
  }, [imageLoaded, getRelativePos]);

  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
    if (!dragging) return;
    setDragCurrent(getRelativePos(clientX, clientY));
  }, [dragging, getRelativePos]);

  const handlePointerUp = useCallback(() => {
    if (!dragging || !dragStart || !dragCurrent) return;
    setDragging(false);
    const x = Math.min(dragStart.x, dragCurrent.x);
    const y = Math.min(dragStart.y, dragCurrent.y);
    const w = Math.abs(dragCurrent.x - dragStart.x);
    const h = Math.abs(dragCurrent.y - dragStart.y);
    if (w > 5 && h > 5) {
      setCrop({ x, y, w, h });
    }
    setDragStart(null);
    setDragCurrent(null);
  }, [dragging, dragStart, dragCurrent]);

  const handleCrop = useCallback(async () => {
    if (!crop || !imgRef.current) return;
    const img = imgRef.current;
    const scaleX = img.naturalWidth / img.clientWidth;
    const scaleY = img.naturalHeight / img.clientHeight;

    const sx = Math.max(0, crop.x * scaleX);
    const sy = Math.max(0, crop.y * scaleY);
    const sw = Math.min(img.naturalWidth - sx, crop.w * scaleX);
    const sh = Math.min(img.naturalHeight - sy, crop.h * scaleY);

    const canvas = document.createElement("canvas");
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.9);
    });
    if (!blob) return;

    const croppedFile = new File([blob], imageFile.name, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
    onCropped(croppedFile);
  }, [crop, imageFile, onCropped]);

  const handleReset = useCallback(() => {
    setCrop(null);
    setDragStart(null);
    setDragCurrent(null);
    setDragging(false);
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg">Crop Photo</h3>
          <button
            type="button"
            onClick={onCancel}
            className="text-[#231F1E]/50 hover:text-[#231F1E] transition-colors"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-[#231F1E]/60 mb-3">
          Click and drag on the image to select the area to crop.
        </p>

        <div
          ref={containerRef}
          className="relative select-none overflow-hidden bg-gray-100 rounded-lg cursor-crosshair"
          onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
          onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={(e) => {
            e.preventDefault();
            const t = e.touches[0];
            handlePointerDown(t.clientX, t.clientY);
          }}
          onTouchMove={(e) => {
            e.preventDefault();
            const t = e.touches[0];
            handlePointerMove(t.clientX, t.clientY);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            handlePointerUp();
          }}
        >
          <Image             ref={imgRef}
            src={imageUrl}
            alt="Crop preview"
            className={`w-full h-auto block ${imageLoaded ? "" : "opacity-0"}`}
            onLoad={() => setImageLoaded(true)}
            draggable={false}
          />

          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-[#231F1E]/50">
              Loading...
            </div>
          )}

          {crop && (
            <div
              className="absolute border-2 border-white"
              style={{
                left: crop.x,
                top: crop.y,
                width: crop.w,
                height: crop.h,
                boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.55)",
                pointerEvents: "none",
              }}
            >
              <div className="absolute inset-0 border border-dashed border-white/80" />
            </div>
          )}

          {dragging && dragStart && dragCurrent && (() => {
            const x = Math.min(dragStart.x, dragCurrent.x);
            const y = Math.min(dragStart.y, dragCurrent.y);
            const w = Math.abs(dragCurrent.x - dragStart.x);
            const h = Math.abs(dragCurrent.y - dragStart.y);
            return (
              <div
                className="absolute border-2 border-white"
                style={{
                  left: x,
                  top: y,
                  width: w,
                  height: h,
                  boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.35)",
                  pointerEvents: "none",
                }}
              >
                <div className="absolute inset-0 border border-dashed border-white/80" />
              </div>
            );
          })()}
        </div>

        <div className="flex items-center justify-between mt-4">
          <button
            type="button"
            onClick={handleReset}
            className="text-sm text-[#231F1E]/60 hover:underline"
          >
            Reset Selection
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCrop}
              disabled={!crop}
              className="px-4 py-2 text-sm text-white bg-[#6B1F2A] rounded-lg hover:bg-[#7d2432] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Apply Crop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
