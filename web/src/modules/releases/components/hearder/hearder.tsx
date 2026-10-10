import { Link } from "@tanstack/react-router";
import { useMyProjects } from "../../hooks/use-my-projects";
import { Rocket } from "lucide-react";
export function Hearder() {
  const { data } = useMyProjects();
  const hasProjects = Boolean(data?.data.length);
  return (
    <div className={`${hasProjects ? "flex" : "hidden lg:flex"} flex-wrap items-center justify-end gap-3 lg:justify-between`}>
      <h1 className="hidden text-xl font-semibold lg:block">Lançamentos</h1>
      {hasProjects && (
        <Link
          to="/dashboard/submit"
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/85 focus-visible:outline-2 focus-visible:outline-ring md:h-9 md:w-auto"
        >
          <Rocket className="size-4" />
          Publicar projeto
        </Link>
      )}
    </div>
  );
}
