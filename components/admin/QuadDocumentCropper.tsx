"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

export type QuadPoint = { x: number; y: number };
export type QuadCrop = {
  topLeft: QuadPoint;
  topRight: QuadPoint;
  bottomRight: QuadPoint;
  bottomLeft: QuadPoint;
};

type Props = {
  imageFile: File;
  onCropped: (croppedFile: File) => void;
  onCancel: () => void;
};

const HANDLE_SIZE = 14; // px in overlay coordinates
const MIN_EDGE_LENGTH = 12; // px in overlay coordinates

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function dist(a: QuadPoint, b: QuadPoint) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function defaultQuad(w: number, h: number): QuadCrop {
  const pad = Math.max(20, Math.min(w, h) * 0.08);
  return {
    topLeft: { x: pad, y: pad },
    topRight: { x: w - pad, y: pad },
    bottomRight: { x: w - pad, y: h - pad },
    bottomLeft: { x: pad, y: h - pad },
  };
}

function orderQuadPoints(q: QuadCrop) {
  // We assume inputs are already in TL/TR/BR/BL ordering.
  return q;
}

/**
 * Computes a homography matrix mapping source quad -> destination rectangle.
 * Returns matrix [a,b,c,d,e,f,g,h] for:
 * x' = (a*x + b*y + c) / (g*x + h*y + 1)
 * y' = (d*x + e*y + f) / (g*x + h*y + 1)
 */
function computeHomography(src: QuadCrop, dstW: number, dstH: number) {
  const { topLeft: A, topRight: B, bottomRight: C, bottomLeft: D } = orderQuadPoints(
    src,
  );
  const dst = {
    A: { x: 0, y: 0 },
    B: { x: dstW, y: 0 },
    C: { x: dstW, y: dstH },
    D: { x: 0, y: dstH },
  };

  // Solve 8 equations for 8 unknowns using Gaussian elimination.
  const m: number[][] = [];
  const addEq = (row: number[], rhs: number) => {
    m.push([...row, rhs]);
  };

  // For each correspondence: x', y'
  // From x' = (a*x + b*y + c)/(g*x + h*y + 1)
  // => x'(g*x + h*y + 1) = a*x + b*y + c
  // => a*x + b*y + c - x'*g*x - x'*h*y = x'
  // Similar for y'.

  // A -> dst.A
  {
    const x = A.x,
      y = A.y,
      X = dst.A.x,
      Y = dst.A.y;
    addEq([x, y, 1, 0, 0, 0, -X * x, -X * y], X);
    addEq([0, 0, 0, x, y, 1, -Y * x, -Y * y], Y);
  }
  // B -> dst.B
  {
    const x = B.x,
      y = B.y,
      X = dst.B.x,
      Y = dst.B.y;
    addEq([x, y, 1, 0, 0, 0, -X * x, -X * y], X);
    addEq([0, 0, 0, x, y, 1, -Y * x, -Y * y], Y);
  }
  // C -> dst.C
  {
    const x = C.x,
      y = C.y,
      X = dst.C.x,
      Y = dst.C.y;
    addEq([x, y, 1, 0, 0, 0, -X * x, -X * y], X);
    addEq([0, 0, 0, x, y, 1, -Y * x, -Y * y], Y);
  }
  // D -> dst.D
  {
    const x = D.x,
      y = D.y,
      X = dst.D.x,
      Y = dst.D.y;
    addEq([x, y, 1, 0, 0, 0, -X * x, -X * y], X);
    addEq([0, 0, 0, x, y, 1, -Y * x, -Y * y], Y);
  }

  // Gaussian elimination
  const n = 8;
  for (let col = 0; col < n; col++) {
    // Find pivot
    let pivot = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(m[row][col]) > Math.abs(m[pivot][col])) pivot = row;
    }
    if (Math.abs(m[pivot][col]) < 1e-12) {
      // Singular; fallback to identity-like.
      return { a: 1, b: 0, c: 0, d: 0, e: 1, f: 0, g: 0, h: 0 };
    }
    // Swap
    if (pivot !== col) {
      const tmp = m[col];
      m[col] = m[pivot];
      m[pivot] = tmp;
    }
    // Normalize pivot row
    const div = m[col][col];
    for (let k = col; k <= n; k++) m[col][k] /= div;

    // Eliminate
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = m[row][col];
      if (Math.abs(factor) < 1e-12) continue;
      for (let k = col; k <= n; k++) m[row][k] -= factor * m[col][k];
    }
  }

  const sol = m.map((r) => r[n]);
  return {
    a: sol[0],
    b: sol[1],
    c: sol[2],
    d: sol[3],
    e: sol[4],
    f: sol[5],
    g: sol[6],
    h: sol[7],
  };
}

function invertHomography(m: {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
  g: number;
  h: number;
}) {
  // Build 3x3 matrix
  const M = [
    [m.a, m.b, m.c],
    [m.d, m.e, m.f],
    [m.g, m.h, 1],
  ];

  const det =
    M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) -
    M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) +
    M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);

  if (Math.abs(det) < 1e-12) return null;

  const inv = [
    [
      (M[1][1] * M[2][2] - M[1][2] * M[2][1]) / det,
      (M[0][2] * M[2][1] - M[0][1] * M[2][2]) / det,
      (M[0][1] * M[1][2] - M[0][2] * M[1][1]) / det,
    ],
    [
      (M[1][2] * M[2][0] - M[1][0] * M[2][2]) / det,
      (M[0][0] * M[2][2] - M[0][2] * M[2][0]) / det,
      (M[0][2] * M[1][0] - M[0][0] * M[1][2]) / det,
    ],
    [
      (M[1][0] * M[2][1] - M[1][1] * M[2][0]) / det,
      (M[0][1] * M[2][0] - M[0][0] * M[2][1]) / det,
      (M[0][0] * M[1][1] - M[0][1] * M[1][0]) / det,
    ],
  ];

  return {
    a: inv[0][0],
    b: inv[0][1],
    c: inv[0][2],
    d: inv[1][0],
    e: inv[1][1],
    f: inv[1][2],
    g: inv[2][0],
    h: inv[2][1],
  };
}

function quadIsReasonable(q: QuadCrop) {
  const q2 = orderQuadPoints(q);
  const edges = [
    dist(q2.topLeft, q2.topRight),
    dist(q2.topRight, q2.bottomRight),
    dist(q2.bottomRight, q2.bottomLeft),
    dist(q2.bottomLeft, q2.topLeft),
  ];
  const minEdge = Math.min(...edges);
  return minEdge >= MIN_EDGE_LENGTH;
}

function getDstSize(q: QuadCrop) {
  // Estimate output rectangle dimensions based on opposite side lengths.
  const w1 = dist(q.topLeft, q.topRight);
  const w2 = dist(q.bottomLeft, q.bottomRight);
  const h1 = dist(q.topLeft, q.bottomLeft);
  const h2 = dist(q.topRight, q.bottomRight);

  const dstW = Math.round(Math.max(w1, w2));
  const dstH = Math.round(Math.max(h1, h2));

  // Bound output size for performance.
  const maxSide = 2000;
  const scale = Math.min(1, maxSide / Math.max(dstW, dstH));
  return {
    dstW: Math.max(1, Math.round(dstW * scale)),
    dstH: Math.max(1, Math.round(dstH * scale)),
  };
}

export default function QuadDocumentCropper({ imageFile, onCropped, onCancel }: Props) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imgDims, setImgDims] = useState<{ w: number; h: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const imageUrl = useMemo(() => URL.createObjectURL(imageFile), [imageFile]);
  useEffect(() => {
    return () => URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  const [quad, setQuad] = useState<QuadCrop | null>(null);

  const dragRef = useRef<{
    handle: keyof QuadCrop | null;
  }>({ handle: null });

  const [isDragging, setIsDragging] = useState(false);

  const getRel = useCallback((clientX: number, clientY: number) => {
    const el = containerRef.current;
    if (!el) return { x: 0, y: 0 };
    const r = el.getBoundingClientRect();
    return {
      x: clamp(clientX - r.left, 0, r.width),
      y: clamp(clientY - r.top, 0, r.height),
    };
  }, []);

  useEffect(() => {
    if (!imgDims || quad) return;
    setQuad(defaultQuad(imgDims.w, imgDims.h));
  }, [imgDims, quad]);

  const onStart = useCallback(
    (handle: keyof QuadCrop) => (clientX: number, clientY: number) => {
      if (!imageLoaded || !quad) return;
      dragRef.current.handle = handle;
      setIsDragging(true);
      const p = getRel(clientX, clientY);
      setQuad((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          [handle]: p,
        };
      });
    },
    [getRel, imageLoaded, quad],
  );

  const updateDuringDrag = useCallback(
    (clientX: number, clientY: number) => {
      if (!quad) return;
      const h = dragRef.current.handle;
      if (!h) return;
      const p = getRel(clientX, clientY);
      setQuad((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          [h]: p,
        };
      });
    },
    [getRel, quad],
  );

  // Pointer events with capture to fix move constraint bugs.
  const activePointerId = useRef<number | null>(null);

  const onPointerDownHandle = useCallback(
    (handle: keyof QuadCrop) => (e: React.PointerEvent) => {
      if (!imageLoaded) return;
      e.preventDefault();
      e.stopPropagation();
      // Keep pointer events responsive.
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      activePointerId.current = e.pointerId;
      dragRef.current.handle = handle;
      setIsDragging(true);
      const p = getRel(e.clientX, e.clientY);
      setQuad((prev) => (prev ? { ...prev, [handle]: p } : prev));
    },
    [getRel, imageLoaded],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      if (activePointerId.current !== null && e.pointerId !== activePointerId.current) return;
      e.preventDefault();
      updateDuringDrag(e.clientX, e.clientY);
    },
    [isDragging, updateDuringDrag],
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (activePointerId.current !== null && e.pointerId !== activePointerId.current) return;
    dragRef.current.handle = null;
    activePointerId.current = null;
    setIsDragging(false);
  }, []);

  const handleReset = useCallback(() => {
    if (!imgDims) return;
    setQuad(defaultQuad(imgDims.w, imgDims.h));
  }, [imgDims]);

  const handleConfirm = useCallback(async () => {
    if (!quad || !imgRef.current) return;
    if (!quadIsReasonable(quad)) return;

    const imgEl = imgRef.current;
    const container = containerRef.current;
    if (!container) return;

    const scaleX = imgEl.naturalWidth / container.clientWidth;
    const scaleY = imgEl.naturalHeight / container.clientHeight;

    const srcScaled: QuadCrop = {
      topLeft: { x: quad.topLeft.x * scaleX, y: quad.topLeft.y * scaleY },
      topRight: { x: quad.topRight.x * scaleX, y: quad.topRight.y * scaleY },
      bottomRight: { x: quad.bottomRight.x * scaleX, y: quad.bottomRight.y * scaleY },
      bottomLeft: { x: quad.bottomLeft.x * scaleX, y: quad.bottomLeft.y * scaleY },
    };

    const { dstW, dstH } = getDstSize(srcScaled);

    const outCanvas = document.createElement("canvas");
    outCanvas.width = dstW;
    outCanvas.height = dstH;
    const ctx = outCanvas.getContext("2d");
    if (!ctx) return;

    // Create ImageData once.
    const outImageData = ctx.createImageData(dstW, dstH);

    const H = computeHomography(srcScaled, dstW, dstH);
    const inv = invertHomography(H);
    if (!inv) return;

    const srcDataCanvas = document.createElement("canvas");
    srcDataCanvas.width = imgEl.naturalWidth;
    srcDataCanvas.height = imgEl.naturalHeight;
    const srcCtx = srcDataCanvas.getContext("2d");
    if (!srcCtx) return;
    srcCtx.drawImage(imgEl, 0, 0);
    const srcData = srcCtx.getImageData(0, 0, imgEl.naturalWidth, imgEl.naturalHeight).data;

    const sample = (sx: number, sy: number) => {
      const x0 = Math.floor(sx);
      const y0 = Math.floor(sy);
      if (x0 < 0 || y0 < 0 || x0 >= imgEl.naturalWidth || y0 >= imgEl.naturalHeight) {
        return [0, 0, 0, 0] as const;
      }
      const idx = (y0 * imgEl.naturalWidth + x0) * 4;
      return [srcData[idx], srcData[idx + 1], srcData[idx + 2], srcData[idx + 3]] as const;
    };

    // For each output pixel, map back to src using inverse homography.
    // x_src = (a*x' + b*y' + c) / (g*x' + h*y' + 1)
    // y_src = (d*x' + e*y' + f) / (g*x' + h*y' + 1)
    const W = dstW;
    const Hh = dstH;

    for (let y = 0; y < Hh; y++) {
      for (let x = 0; x < W; x++) {
        const denom = inv.g * x + inv.h * y + 1;
        const sx = (inv.a * x + inv.b * y + inv.c) / denom;
        const sy = (inv.d * x + inv.e * y + inv.f) / denom;
        const [r, g, b, a] = sample(sx, sy);

        const outIdx = (y * W + x) * 4;
        outImageData.data[outIdx] = r;
        outImageData.data[outIdx + 1] = g;
        outImageData.data[outIdx + 2] = b;
        outImageData.data[outIdx + 3] = a;
      }
    }

    ctx.putImageData(outImageData, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) => {
      outCanvas.toBlob((b) => resolve(b), "image/jpeg", 0.92);
    });

    if (!blob) return;

    const base = imageFile.name.replace(/\.[^/.]+$/, "");
    const croppedFile = new File([blob], `${base}-scanned.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
    onCropped(croppedFile);
  }, [quad, onCropped, imageFile]);

  const quadPath = useMemo(() => {
    if (!quad) return "";
    const { topLeft, topRight, bottomRight, bottomLeft } = quad;
    return `M ${topLeft.x} ${topLeft.y} L ${topRight.x} ${topRight.y} L ${bottomRight.x} ${bottomRight.y} L ${bottomLeft.x} ${bottomLeft.y} Z`;
  }, [quad]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg">Edit Photo (Scan Crop)</h3>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="w-9 h-9 rounded-full grid place-items-center text-[#231F1E]/60 hover:text-[#231F1E] hover:bg-black/5 transition-colors"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-[#231F1E]/60 mb-3">
          Drag the four corners to match the document edges.
        </p>

        <div
          ref={containerRef}
          className="relative select-none overflow-hidden bg-gray-100 rounded-lg cursor-crosshair touch-none"
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <Image
            ref={imgRef}
            src={imageUrl}
            alt="Crop preview"
            className={`w-full h-auto block ${imageLoaded ? "" : "opacity-0"}`}
            onLoad={(e) => {
              setImageLoaded(true);
              const img = e.currentTarget;
              // Container dims drive overlay coords.
              const cont = containerRef.current;
              if (cont) {
                setImgDims({ w: cont.clientWidth, h: cont.clientHeight });
              } else {
                setImgDims({ w: img.clientWidth, h: img.clientHeight });
              }
            }}
            draggable={false}
            unoptimized
          />

          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-[#231F1E]/50">
              Loading...
            </div>
          )}

          {quad && (
            <>
              {/* Polygon outline */}
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox={`0 0 ${imgDims?.w ?? 1} ${imgDims?.h ?? 1}`}
                preserveAspectRatio="none"
              >
                <polygon
                  points={quadPath
                    .replace("M", "")
                    .replace("Z", "")
                    .replaceAll("L", "")}
                  fill="rgba(0,0,0,0)"
                  stroke="rgba(255,255,255,0.95)"
                  strokeWidth={2}
                />
              </svg>

              {/* Bounding shading */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(transparent 0%, rgba(0,0,0,0.55) 72%), rgba(0,0,0,0.45)",
                  mixBlendMode: "multiply",
                  opacity: 0.35,
                  pointerEvents: "none",
                }}
              />

              {/* Handles + invisible hit areas */}
              {(
                [
                  ["topLeft", quad.topLeft],
                  ["topRight", quad.topRight],
                  ["bottomRight", quad.bottomRight],
                  ["bottomLeft", quad.bottomLeft],
                ] as const
              ).map(([key, p]) => (
                <div
                  key={key}
                  style={{
                    position: "absolute",
                    left: p.x - HANDLE_SIZE / 2,
                    top: p.y - HANDLE_SIZE / 2,
                    width: HANDLE_SIZE,
                    height: HANDLE_SIZE,
                    borderRadius: 999,
                    background: "#6B1F2A",
                    border: "2px solid rgba(255,255,255,0.95)",
                    boxShadow: isDragging ? "0 0 0 3px rgba(107,31,42,0.25)" : "0 0 0 2px rgba(255,255,255,0.15)",
                    zIndex: 3,
                    touchAction: "none",
                  }}
                  onPointerDown={onPointerDownHandle(key as keyof QuadCrop)}
                />
              ))}

              {/* Side lines */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox={`0 0 ${imgDims?.w ?? 1} ${imgDims?.h ?? 1}`}
                preserveAspectRatio="none"
              >
                <path d={quadPath} fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth={2} />
              </svg>
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between mt-4">
          <button
            type="button"
            onClick={handleReset}
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
              onClick={() => {
                void handleConfirm();
              }}
              disabled={!quad || !quadIsReasonable(quad)}
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

