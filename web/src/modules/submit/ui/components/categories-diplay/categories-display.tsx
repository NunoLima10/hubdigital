import { Badge } from "@/components/ui/badge";
export function CategoriesDisplay({
  label,
  badges,
}: {
  label: string;
  badges: string[];
}) {
  return (
    <div className="space-y-1.5">
      <dt className="text-sm font-medium">{label}</dt>
      <dd className="flex flex-wrap gap-1.5">
        {badges.length ? (
          badges.map((badge) => <Badge key={badge}>{badge}</Badge>)
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </dd>
    </div>
  );
}
