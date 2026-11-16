import { useEffect, useState } from "react";

type PreviewImage = {
  url: string;
  width: number;
  height: number;
  size: number;
  sizeDisplay: string;
};

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
  return `${size} ${sizes[i]}`;
}

export function useImagePreview(file: File | null | undefined) {
  const [preview, setPreview] = useState<undefined | PreviewImage>();

  useEffect(() => {
    setPreview(undefined);
    if (!file) return;

    const url = URL.createObjectURL(file);
    const img = new Image();
    let cancelled = false;

    img.onload = () => {
      if (cancelled) return;
      setPreview({
        url,
        width: img.width,
        height: img.height,
        size: file.size,
        sizeDisplay: formatBytes(file.size),
      });
    };
    img.src = url;

    return () => {
      cancelled = true;
      img.onload = null;
      URL.revokeObjectURL(url);
    };
  }, [file]);

  return preview;
}
