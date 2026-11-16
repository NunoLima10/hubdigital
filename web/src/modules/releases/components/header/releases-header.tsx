import { buttonVariants } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { useMyProjects } from "../../hooks/use-my-projects";
import { Rocket } from "lucide-react";
export function ReleasesHeader() {
  const { data } = useMyProjects();
  const hasProjects = Boolean(data?.data.length);
  return (
    <div className={`${hasProjects ? "flex" : "hidden lg:flex"} flex-wrap items-center justify-end gap-3 lg:justify-between`}>
      <h1 className="hidden text-xl font-semibold lg:block">Projetos</h1>
      {hasProjects && (
        <Link
          to="/dashboard/submit"
          className={buttonVariants({ className: "w-full md:w-auto" })}
        >
          <Rocket className="size-4" />
          Publicar projeto
        </Link>
      )}
    </div>
  );
}
