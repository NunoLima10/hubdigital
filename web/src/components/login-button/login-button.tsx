import { Link } from "@tanstack/react-router";
import { UserRound } from "lucide-react";
import { SignedOut } from "../signed-out/signed-out";

export function LoginButton() {
  return (
    <SignedOut>
      <Link
        to="/sign-in"
        className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/85"
      >
        <UserRound className="size-4" />
        Entrar
      </Link>
    </SignedOut>
  );
}
