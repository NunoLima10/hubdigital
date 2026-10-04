import { useUpload } from "@/hooks/use-upload";
import { useImagePreview } from "@/modules/submit/hooks/use-image-preview";
import { formatBytes } from "@/utils/format-bytes";
import type { FileUploadType } from "@hubdigital/shared";
import { ImageIcon, Trash2, Upload } from "lucide-react";
import { useState } from "react";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
type Props = {
  label: string;
  type: FileUploadType;
  value?: string | null;
  previewUrl?: string;
  onChange: (key: string | null) => void;
  recomandations?: string;
  actionLabel?: string;
  required?: boolean;
  error?: string;
};
export function ImageSelector({
  label,
  type,
  value,
  previewUrl,
  onChange,
  recomandations,
  actionLabel = "Carregar imagem",
  required,
  error,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string>();
  const preview = useImagePreview(file);
  const { upload, percentage, isUploading } = useUpload();
  async function select(selected: File | null) {
    if (!selected) return;
    if (selected.size > MAX_SIZE_BYTES) {
      setUploadError(
        `A imagem excede o limite de ${formatBytes(MAX_SIZE_BYTES)}.`,
      );
      return;
    }
    setUploadError(undefined);
    setFile(selected);
    try {
      onChange(await upload(selected, type));
    } catch {
      setFile(null);
      onChange(null);
      setUploadError("Não foi possível carregar a imagem. Tenta novamente.");
    }
  }
  const hasImage = Boolean(file || value || (previewUrl && value !== null));
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-sm font-medium">
          {label}
          {required && " *"}
        </label>
        <span className="text-xs text-muted-foreground">{recomandations}</span>
      </div>
      {!hasImage ? (
        <label
          className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm hover:bg-muted ${isUploading ? "pointer-events-none opacity-50" : ""}`}
        >
          <Upload className="size-4" />
          {actionLabel}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            disabled={isUploading}
            onChange={(event) => void select(event.target.files?.[0] ?? null)}
          />
        </label>
      ) : (
        <div className="flex items-center justify-between rounded-lg border p-2">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded bg-muted">
              {preview?.url || previewUrl ? (
                <img
                  src={preview?.url ?? previewUrl}
                  alt="Pré-visualização"
                  className="size-full object-cover"
                />
              ) : (
                <ImageIcon className="size-6 text-muted-foreground" />
              )}
            </span>
            <div className="min-w-0 text-sm">
              <p className="truncate">{file?.name ?? "Imagem atual"}</p>
              {preview && (
                <p className="text-xs text-muted-foreground">
                  {formatBytes(preview.size)} · {preview.width} ×{" "}
                  {preview.height}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            disabled={isUploading}
            className="rounded p-2 text-destructive hover:bg-muted"
            aria-label={`Remover ${label.toLowerCase()}`}
            onClick={() => {
              setFile(null);
              setUploadError(undefined);
              onChange(null);
            }}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      )}
      {isUploading && (
        <div
          role="progressbar"
          aria-valuenow={percentage ?? 0}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-2 overflow-hidden rounded bg-muted"
        >
          <div
            className="h-full bg-primary"
            style={{ width: `${percentage ?? 0}%` }}
          />
        </div>
      )}
      {(uploadError || error) && (
        <p className="text-xs text-destructive">{uploadError ?? error}</p>
      )}
    </div>
  );
}
