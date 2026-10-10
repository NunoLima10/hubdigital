import { authClient } from "@/lib/auth-client";
import { useMyHandle } from "@/modules/makers/hooks/use-maker";
import { Link } from "@tanstack/react-router";
import { ExternalLink, UserRound } from "lucide-react";

export function Profile() {
  const { data } = authClient.useSession();
  const { data: handle } = useMyHandle();

  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted text-muted-foreground">
        {data?.user.image ? (
          <img
            src={data.user.image}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <UserRound className="size-5" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">
          {data?.user.name ?? "Minha conta"}
        </p>
        <p className="truncate text-sm text-muted-foreground">
          {data?.user.email}
        </p>
      </div>
      {handle && (
        <Link
          to="/makers/$handle"
          params={{ handle }}
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-muted"
        >
          Ver perfil
          <ExternalLink className="size-4" />
        </Link>
      )}
    </div>
  );
}
