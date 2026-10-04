import { authClient } from "@/lib/auth-client";
import { UserRound } from "lucide-react";

export function Profile() {
  const { data } = authClient.useSession();
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-muted">
        {data?.user.image ? (
          <img
            src={data.user.image}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <UserRound className="size-4" />
        )}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {data?.user.name ?? "Minha conta"}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {data?.user.email}
        </p>
      </div>
    </div>
  );
}
