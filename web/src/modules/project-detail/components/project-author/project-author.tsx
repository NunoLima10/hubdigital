import type { ProjectAuthor } from "@hubdigital/shared";
import { Link } from "@tanstack/react-router";
import { UserRound } from "lucide-react";

export function ProjectAuthorRow({
  author,
  size = 36,
}: {
  author?: ProjectAuthor | null;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <span
        className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-muted-foreground"
        style={{ width: size, height: size }}
      >
        {author?.image ? (
          <img src={author.image} alt="" className="size-full object-cover" />
        ) : (
          <UserRound className="size-4" />
        )}
      </span>
      {author?.handle ? (
        <Link
          to="/makers/$handle"
          params={{ handle: author.handle }}
          className="font-medium hover:underline"
        >
          {author.name}
        </Link>
      ) : (
        <span className="font-medium">
          {author?.name ?? "Publicador desconhecido"}
        </span>
      )}
    </div>
  );
}
