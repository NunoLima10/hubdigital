import { useUpload } from "@/hooks/use-upload";
import { toAssetUrl } from "@/utils/asset-url";
import { formatBytes } from "@/utils/format-bytes";
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  ImageIcon,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState, type DragEvent } from "react";

const MAX_IMAGES = 10;
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

type LocalPreview = {
  url: string;
  name: string;
  width: number;
  height: number;
};

type Props = {
  value: string[];
  previewUrls?: string[];
  onChange: (keys: string[]) => void;
  onPreviewChange?: (key: string, file: File) => void;
  onPreviewRemove?: (key: string) => void;
  error?: string;
};

async function inspectImage(file: File) {
  const url = URL.createObjectURL(file);
  const dimensions = await new Promise<{ width: number; height: number }>(
    (resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.width, height: image.height });
      image.onerror = reject;
      image.src = url;
    },
  );
  return { url, name: file.name, ...dimensions };
}

function move<T>(items: T[], from: number, to: number) {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function GalleryImageSelector({
  value,
  previewUrls,
  onChange,
  onPreviewChange,
  onPreviewRemove,
  error,
}: Props) {
  const { upload, percentage, isUploading } = useUpload();
  const savedPreviews = useRef(
    Object.fromEntries(
      value.map((key, index) => [key, previewUrls?.[index]]).filter((entry) => entry[1]),
    ) as Record<string, string>,
  );
  const [localPreviews, setLocalPreviews] = useState<Record<string, LocalPreview>>({});
  const previewsRef = useRef(localPreviews);
  const [uploadLabel, setUploadLabel] = useState<string>();
  const [uploadError, setUploadError] = useState<string>();
  const [draggedIndex, setDraggedIndex] = useState<number>();

  useEffect(() => {
    previewsRef.current = localPreviews;
  }, [localPreviews]);

  useEffect(
    () => () => {
      Object.values(previewsRef.current).forEach((preview) =>
        URL.revokeObjectURL(preview.url),
      );
    },
    [],
  );

  async function addFiles(files: File[]) {
    setUploadError(undefined);
    const remaining = MAX_IMAGES - value.length;
    if (remaining <= 0) {
      setUploadError("A galeria já tem o máximo de 10 imagens.");
      return;
    }

    const selected = files.slice(0, remaining);
    if (files.length > remaining) {
      setUploadError(`Foram selecionadas apenas ${remaining} imagens para respeitar o limite.`);
    }

    const invalid = selected.find(
      (file) => !ACCEPTED_TYPES.has(file.type) || file.size > MAX_SIZE_BYTES,
    );
    if (invalid) {
      setUploadError(
        !ACCEPTED_TYPES.has(invalid.type)
          ? `${invalid.name}: use PNG, JPG ou WebP.`
          : `${invalid.name}: a imagem excede ${formatBytes(MAX_SIZE_BYTES)}.`,
      );
      return;
    }

    const uploaded: string[] = [];
    for (const [index, file] of selected.entries()) {
      setUploadLabel(`${index + 1} de ${selected.length}: ${file.name}`);
      try {
        const preview = await inspectImage(file);
        const key = await upload(file, "project_gallery");
        uploaded.push(key);
        setLocalPreviews((current) => ({ ...current, [key]: preview }));
        onPreviewChange?.(key, file);
      } catch {
        setUploadError(`${file.name}: não foi possível carregar. Tenta novamente.`);
        break;
      }
    }
    setUploadLabel(undefined);
    if (uploaded.length) onChange([...value, ...uploaded]);
  }

  function reorder(from: number, to: number) {
    if (to < 0 || to >= value.length || from === to) return;
    onChange(move(value, from, to));
  }

  function drop(event: DragEvent, index?: number) {
    event.preventDefault();
    if (draggedIndex !== undefined && index !== undefined) {
      reorder(draggedIndex, index);
      setDraggedIndex(undefined);
      return;
    }
    void addFiles(Array.from(event.dataTransfer.files));
  }

  return (
    <section className="space-y-3" aria-labelledby="gallery-label">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p id="gallery-label" className="text-sm font-medium">
            Imagens (opcional)
          </p>
          <p className="text-xs text-muted-foreground">
            Opcional · até 10 imagens · PNG, JPG ou WebP até 5 MB · recomendado 1280 × 720
          </p>
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">
          {value.length} / {MAX_IMAGES}
        </span>
      </div>

      {value.length < MAX_IMAGES && (
        <label
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => drop(event)}
          className={`flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/30 px-4 text-center hover:border-primary hover:bg-primary-soft ${isUploading ? "pointer-events-none opacity-60" : ""}`}
        >
          <Upload className="size-5 text-muted-foreground" />
          <span className="text-sm font-medium">Escolher ou largar imagens</span>
          <span className="text-xs text-muted-foreground">
            Podes selecionar várias de uma vez
          </span>
          <input
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            disabled={isUploading}
            onChange={(event) => {
              void addFiles(Array.from(event.target.files ?? []));
              event.target.value = "";
            }}
          />
        </label>
      )}

      {isUploading && (
        <div className="space-y-1" aria-live="polite">
          <div className="flex justify-between gap-3 text-xs text-muted-foreground">
            <span className="truncate">{uploadLabel}</span>
            <span>{percentage ?? 0}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded bg-muted">
            <div className="h-full bg-primary" style={{ width: `${percentage ?? 0}%` }} />
          </div>
        </div>
      )}

      {value.length > 0 && (
        <ol className="space-y-2">
          {value.map((key, index) => {
            const local = localPreviews[key];
            const previewUrl = local?.url ?? savedPreviews.current[key] ?? toAssetUrl(key);
            const ratio = local ? local.width / local.height : undefined;
            const ratioWarning = ratio && Math.abs(ratio - 16 / 9) > 0.12;
            return (
              <li
                key={key}
                draggable={!isUploading}
                onDragStart={() => setDraggedIndex(index)}
                onDragEnd={() => setDraggedIndex(undefined)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => drop(event, index)}
                className="flex items-center gap-3 rounded-lg border bg-background p-2"
              >
                <GripVertical className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="flex aspect-video w-24 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                  {previewUrl ? (
                    <img src={previewUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <ImageIcon className="size-5 text-muted-foreground" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {index === 0 ? "Imagem de capa" : `${index + 1}.`} {local?.name ?? `Imagem ${index + 1}`}
                  </p>
                  {local && (
                    <p className={`text-xs ${ratioWarning ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground"}`}>
                      {local.width} × {local.height}
                      {ratioWarning ? " · será recortada para 16:9" : " · 16:9"}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center">
                  <button type="button" className="rounded p-2 hover:bg-muted disabled:opacity-30" disabled={index === 0 || isUploading} onClick={() => reorder(index, index - 1)} aria-label={`Mover imagem ${index + 1} para cima`}>
                    <ArrowUp className="size-4" />
                  </button>
                  <button type="button" className="rounded p-2 hover:bg-muted disabled:opacity-30" disabled={index === value.length - 1 || isUploading} onClick={() => reorder(index, index + 1)} aria-label={`Mover imagem ${index + 1} para baixo`}>
                    <ArrowDown className="size-4" />
                  </button>
                  <button
                    type="button"
                    className="rounded p-2 text-destructive hover:bg-muted disabled:opacity-30"
                    disabled={isUploading}
                    onClick={() => {
                      const preview = localPreviews[key];
                      if (preview) URL.revokeObjectURL(preview.url);
                      setLocalPreviews((current) => {
                        const next = { ...current };
                        delete next[key];
                        return next;
                      });
                      onPreviewRemove?.(key);
                      onChange(value.filter((item) => item !== key));
                    }}
                    aria-label={`Remover imagem ${index + 1}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {(uploadError || error) && (
        <p className="text-xs text-destructive" role="alert">
          {uploadError ?? error}
        </p>
      )}
    </section>
  );
}
