"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

type Props = {
  imageFile: File;
  onCropped: (croppedFile: File) => void;
  onCancel: () => void;
};

export default function ImageCropper({ imageFile, onCropped, onCancel }: Props) {
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    x: 25,
    y: 25,
    width: 50,
    height: 50,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageUrl = useMemo(() => URL.createObjectURL(imageFile), [imageFile]);

  useEffect(() => {
    return () => URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  const onCropChange = useCallback((c: Crop) => setCrop(c), []);
  const onCropComplete = useCallback((c: PixelCrop) => setCompletedCrop(c), []);

  const handleConfirm = useCallback(async () => {
    const imgEl = imgRef.current;
    if (!imgEl || !completedCrop) return;

    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const scaleX = imgEl.naturalWidth / imgEl.width;
    const scaleY = imgEl.naturalHeight / imgEl.height;
    const pixelRatio = window.devicePixelRatio;

    canvas.width = Math.floor(completedCrop.width * scaleX * pixelRatio);
    canvas.height = Math.floor(completedCrop.height * scaleY * pixelRatio);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingQuality = "high";

    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;

    ctx.save();
    ctx.translate(-cropX, -cropY);
    ctx.drawImage(
      imgEl,
      0, 0, imgEl.naturalWidth, imgEl.naturalHeight,
      0, 0, imgEl.naturalWidth, imgEl.naturalHeight
    );
    ctx.restore();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92);
    });

    if (!blob) return;

    const base = imageFile.name.replace(/\.[^/.]+$/, "");
    const croppedFile = new File([blob], `${base}-cropped.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
    onCropped(croppedFile);
  }, [completedCrop, imageFile, onCropped]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg">Crop Image</h3>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="w-9 h-9 rounded-full grid place-items-center text-[#231F1E]/60 hover:text-[#231F1E] hover:bg-black/5 transition-colors"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-[#231F1E]/60 mb-3">Drag to adjust the crop area.</p>

        <div className="relative select-none overflow-hidden bg-gray-100 rounded-lg">
          <ReactCrop
            crop={crop}
            onChange={onCropChange}
            onComplete={onCropComplete}
            keepSelection
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Crop preview"
              onLoad={() => setImageLoaded(true)}
              className={`w-full h-auto block ${imageLoaded ? "" : "opacity-0"}`}
            />
          </ReactCrop>
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-[#231F1E]/50">Loading...</div>
          )}
        </div>

        <canvas ref={previewCanvasRef} style={{ display: "none" }} />

        <div className="flex items-center justify-between mt-4">
          <button
            type="button"
            onClick={() => setCrop({ unit: "%", x: 25, y: 25, width: 50, height: 50 })}
            className="text-sm text-[#231F1E]/60 hover:underline"
          >
            Reset
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
              onClick={() => void handleConfirm()}
              disabled={!completedCrop}
              className="px-4 py-2 text-sm text-white bg-[#6B1F2A] rounded-lg hover:bg-[#7d2432] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Confirm Crop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}