"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import Image from "next/image";

type Props = {
  imageFile: File;
  onCropped: (croppedFile: File) => void;
  onCancel: () => void;
};

import QuadDocumentCropper from "./QuadDocumentCropper";

export default function ImageCropper({ imageFile, onCropped, onCancel }: Props) {
  // Updated: replace legacy rectangular cropper with a 4-point document-style cropper.
  // This component keeps the same external API so existing modal/file-upload logic works.
  // The UI/interaction improvements (corner handles + robust pointer capture) live in QuadDocumentCropper.
  return (
    <QuadDocumentCropper
      imageFile={imageFile}
      onCropped={onCropped}
      onCancel={onCancel}
    />
  );
}


