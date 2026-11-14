import { ProjectSummary } from "@/components/project-summary/project-summary";
export function ProjectCard({name,iconUrl,description,badges=[]}:{name:string;iconUrl?:string;description:string;badges?:string[]}) {
 return <div className="rounded-lg border p-4"><ProjectSummary iconUrl={iconUrl} title={<p className="font-semibold">{name}</p>} description={description} topics={badges}/></div>;
}
