import { Link } from "@tanstack/react-router";
import { Rocket } from "lucide-react";
export function Hearder() {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3 lg:justify-between">
      <h1 className="hidden text-xl font-semibold lg:block">Lançamentos</h1>
      <Link
        to="/dashboard/submit"
        className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/85"
      >
        <Rocket className="size-4" />
        Publicar projeto
      </Link>
    </div>
  );
}
