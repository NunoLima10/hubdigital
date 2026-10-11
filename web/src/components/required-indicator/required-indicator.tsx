export function RequiredIndicator() {
  return (
    <>
      <span className="text-destructive" aria-hidden="true">
        {" "}*
      </span>
      <span className="sr-only"> (obrigatório)</span>
    </>
  );
}
