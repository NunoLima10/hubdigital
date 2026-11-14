export function AuthDivider() {
  return (
    <div className="flex items-center gap-3" aria-hidden="true">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs uppercase text-muted-foreground">ou</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
