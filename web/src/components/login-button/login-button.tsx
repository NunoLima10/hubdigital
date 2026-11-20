import { buttonVariants } from "@/components/ui/button";
import { SignInDialog } from "@/modules/auth/components/sign-in-dialog/sign-in-dialog";
import { UserRound } from "lucide-react";
import { useState, type ReactNode } from "react";
import { SignedOut } from "../signed-out/signed-out";

type LoginButtonProps = {
  /** Replaces the default "Entrar" label and icon. */
  children?: ReactNode;
  className?: string;
  /** Heading and line of the sign-in modal, to say why it is asking. */
  title?: string;
  subtitle?: string;
};

/**
 * Opens the sign-in modal instead of leaving for /sign-in, so the visitor is
 * still on the same page, scroll position and draft when they come back.
 */
export function LoginButton({ children, className, title, subtitle }: LoginButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <SignedOut>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? buttonVariants()}
      >
        {children ?? (
          <>
            <UserRound className="size-4" />
            Entrar
          </>
        )}
      </button>
      <SignInDialog
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        subtitle={subtitle}
      />
    </SignedOut>
  );
}

/** Text-link look for inline prompts ("Entrar para apoiar anúncios"). */
export const loginLinkClassName =
  "rounded-sm text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
