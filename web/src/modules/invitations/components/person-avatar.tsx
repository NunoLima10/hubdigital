import { useState } from "react";
import { cn } from "@/lib/utils";

export function PersonAvatar({
  name,
  image,
  className,
}: {
  name: string;
  image: string | null;
  className?: string;
}) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase();
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted text-xs font-medium text-muted-foreground",
        className,
      )}
    >
      {image && image !== failedImage ? (
        <img
          src={image}
          alt=""
          className="size-full object-cover"
          onError={() => setFailedImage(image)}
        />
      ) : (
        initials
      )}
    </span>
  );
}
