import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProjectBanner({
  bannerUrl,
  className,
}: {
  bannerUrl?: string | null;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg border bg-muted text-sm text-muted-foreground",
        className,
      )}
    >
      {bannerUrl ? (
        <img
          src={bannerUrl}
          alt="Imagem do projeto"
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="flex flex-col items-center gap-2">
          <ImageIcon className="size-8" />
          Imagem em breve
        </span>
      )}
    </div>
  );
}
