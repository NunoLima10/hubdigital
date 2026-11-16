import { buttonVariants } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { UserRound } from "lucide-react";
import { SignedOut } from "../signed-out/signed-out";

export function LoginButton() {
  return (
    <SignedOut>
      <Link
        to="/sign-in"
        className={buttonVariants()}
      >
        <UserRound className="size-4" />
        Entrar
      </Link>
    </SignedOut>
  );
}
