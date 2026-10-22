import { Button, buttonVariants } from "@/components/ui/button";
import { Link, type ErrorComponentProps } from "@tanstack/react-router";

export function Erro({ reset }: ErrorComponentProps) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold">Algo correu mal</h1>
      <p className="text-sm text-muted-foreground">
        Não conseguimos mostrar esta página. Tenta de novo; se continuar, volta mais tarde.
      </p>
      <div className="flex gap-2">
        <Button onClick={reset}>Tentar de novo</Button>
        <Link to="/" className={buttonVariants({ variant: "outline" })}>
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
