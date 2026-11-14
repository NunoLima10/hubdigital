import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ImageIcon, Maximize2, Play, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type GalleryItem =
  | { type: "video"; id: string }
  | { type: "image"; url: string; imageIndex: number };

export function ProjectGallery({
  imageUrls,
  youtubeVideoId,
  projectName,
  className,
}: {
  imageUrls: string[];
  youtubeVideoId?: string | null;
  projectName: string;
  className?: string;
}) {
  const items: GalleryItem[] = [
    ...(youtubeVideoId ? [{ type: "video" as const, id: youtubeVideoId }] : []),
    ...imageUrls.map((url, imageIndex) => ({ type: "image" as const, url, imageIndex })),
  ];
  const [active, setActive] = useState(0);
  const [playingVideo, setPlayingVideo] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<number | null>(null);
  const touchStart = useRef<number | undefined>(undefined);
  const lightboxTouchStart = useRef<number | undefined>(undefined);

  useEffect(() => {
    setActive((current) => Math.min(current, Math.max(items.length - 1, 0)));
    setPlayingVideo(false);
  }, [imageUrls.length, items.length, youtubeVideoId]);

  useEffect(() => {
    setLightboxImage((current) => {
      if (current === null || imageUrls.length === 0) return null;
      return Math.min(current, imageUrls.length - 1);
    });
  }, [imageUrls.length]);

  useEffect(() => {
    if (lightboxImage === null || imageUrls.length < 2) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setLightboxImage((current) =>
          current === null ? null : (current - 1 + imageUrls.length) % imageUrls.length,
        );
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setLightboxImage((current) =>
          current === null ? null : (current + 1) % imageUrls.length,
        );
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [imageUrls.length, lightboxImage]);

  const item = items[active];
  if (!item) {
    return (
      <div className={cn("flex aspect-video items-center justify-center rounded-lg border bg-muted text-muted-foreground", className)}>
        <span className="flex flex-col items-center gap-2 text-sm">
          <ImageIcon className="size-8" />
          Imagem em breve
        </span>
      </div>
    );
  }

  function select(index: number) {
    setActive(index);
    setPlayingVideo(false);
  }

  function showPreviousImage() {
    setLightboxImage((current) =>
      current === null ? null : (current - 1 + imageUrls.length) % imageUrls.length,
    );
  }

  function showNextImage() {
    setLightboxImage((current) =>
      current === null ? null : (current + 1) % imageUrls.length,
    );
  }

  return (
    <>
      <section className={cn("space-y-3", className)} aria-label="Galeria do projeto">
        <div
          className="group relative aspect-video max-h-[34rem] overflow-hidden rounded-lg border bg-muted focus-visible:outline-2 focus-visible:outline-primary"
          tabIndex={0}
          role="group"
          aria-roledescription="carousel"
          aria-label={`Conteúdo ${active + 1} de ${items.length}`}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") select((active - 1 + items.length) % items.length);
            if (event.key === "ArrowRight") select((active + 1) % items.length);
          }}
          onTouchStart={(event) => {
            touchStart.current = event.touches[0]?.clientX;
          }}
          onTouchEnd={(event) => {
            const start = touchStart.current;
            const end = event.changedTouches[0]?.clientX;
            if (start === undefined || end === undefined || Math.abs(start - end) < 40) return;
            select(start > end ? (active + 1) % items.length : (active - 1 + items.length) % items.length);
            touchStart.current = undefined;
          }}
        >
          {item.type === "image" ? (
            <button
              type="button"
              onClick={() => setLightboxImage(item.imageIndex)}
              className="group/image relative size-full cursor-zoom-in focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-white"
              aria-label={`Ampliar imagem ${item.imageIndex + 1} de ${projectName}`}
            >
              <img
                src={item.url}
                alt={`${projectName}, imagem ${item.imageIndex + 1} de ${imageUrls.length}`}
                className="size-full object-contain"
              />
              <span className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-black/65 text-white opacity-100 shadow-sm backdrop-blur-sm transition-opacity sm:opacity-0 sm:group-hover/image:opacity-100 sm:group-focus-visible/image:opacity-100">
                <Maximize2 className="size-4" aria-hidden="true" />
              </span>
            </button>
          ) : playingVideo ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${item.id}?autoplay=1&rel=0`}
              title={`Trailer de ${projectName}`}
              className="size-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlayingVideo(true)}
              className="relative size-full focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-white"
              aria-label={`Reproduzir trailer de ${projectName}`}
            >
              <img
                src={`https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`}
                alt=""
                className="size-full object-cover"
              />
              <span className="absolute inset-0 grid place-items-center bg-black/20">
                <span className="grid size-16 place-items-center rounded-full bg-white text-black shadow-lg">
                  <Play className="ml-1 size-7 fill-current" />
                </span>
              </span>
            </button>
          )}

          {items.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => select((active - 1 + items.length) % items.length)}
                className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-background/90 text-foreground shadow-sm opacity-100 backdrop-blur sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                aria-label="Conteúdo anterior"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => select((active + 1) % items.length)}
                className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-background/90 text-foreground shadow-sm opacity-100 backdrop-blur sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                aria-label="Conteúdo seguinte"
              >
                <ChevronRight className="size-5" />
              </button>
            </>
          )}
          <span className="absolute bottom-3 right-3 rounded-full bg-black/65 px-2.5 py-1 text-xs tabular-nums text-white">
            {active + 1} / {items.length}
          </span>
        </div>

        {items.length > 1 && (
          <div className="flex snap-x gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Escolher conteúdo da galeria">
            {items.map((galleryItem, index) => (
              <button
                key={galleryItem.type === "video" ? `video-${galleryItem.id}` : galleryItem.url}
                type="button"
                role="tab"
                aria-selected={index === active}
                onClick={() => select(index)}
                className={`relative aspect-video w-28 shrink-0 snap-start overflow-hidden rounded-md border-2 bg-muted ${index === active ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"}`}
              >
                <img
                  src={galleryItem.type === "video" ? `https://i.ytimg.com/vi/${galleryItem.id}/hqdefault.jpg` : galleryItem.url}
                  alt={galleryItem.type === "video" ? "Trailer" : `Imagem ${galleryItem.imageIndex + 1}`}
                  className="size-full object-contain"
                />
                {galleryItem.type === "video" && (
                  <span className="absolute inset-0 grid place-items-center bg-black/15 text-white">
                    <Play className="size-5 fill-current" />
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </section>

      <Dialog
        open={lightboxImage !== null}
        onClose={() => setLightboxImage(null)}
        title={`Imagens de ${projectName}`}
        hideHeader
        className="h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-none rounded-xl border-white/10 bg-black/95 text-white shadow-2xl md:h-[calc(100dvh-2rem)] md:w-[calc(100%-2rem)] md:rounded-2xl"
        bodyClassName="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-4 pb-4 md:p-8"
      >
        {lightboxImage !== null && (
          <>
            <img
              src={imageUrls[lightboxImage]}
              alt={`${projectName}, imagem ${lightboxImage + 1} de ${imageUrls.length}`}
              className="max-h-full max-w-full select-none object-contain"
              draggable={false}
              onTouchStart={(event) => {
                lightboxTouchStart.current = event.touches[0]?.clientX;
              }}
              onTouchEnd={(event) => {
                const start = lightboxTouchStart.current;
                const end = event.changedTouches[0]?.clientX;
                lightboxTouchStart.current = undefined;
                if (
                  start === undefined ||
                  end === undefined ||
                  Math.abs(start - end) < 40 ||
                  imageUrls.length < 2
                ) {
                  return;
                }
                if (start > end) showNextImage();
                else showPreviousImage();
              }}
            />

            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute right-3 top-3 grid size-11 place-items-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:right-5 md:top-5"
              aria-label="Fechar visualização ampliada"
            >
              <X className="size-5" />
            </button>

            {imageUrls.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={showPreviousImage}
                  className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:left-5 md:size-12"
                  aria-label="Imagem anterior"
                >
                  <ChevronLeft className="size-6" />
                </button>
                <button
                  type="button"
                  onClick={showNextImage}
                  className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:right-5 md:size-12"
                  aria-label="Imagem seguinte"
                >
                  <ChevronRight className="size-6" />
                </button>
              </>
            )}

            <span
              className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/65 px-3 py-1.5 text-sm tabular-nums text-white backdrop-blur-md md:bottom-5"
              aria-live="polite"
            >
              {lightboxImage + 1} / {imageUrls.length}
            </span>
          </>
        )}
      </Dialog>
    </>
  );
}
