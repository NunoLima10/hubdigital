import { Dialog } from "@/components/ui/dialog";
import { useLocation } from "@tanstack/react-router";
import { X } from "lucide-react";
import { safeRedirect } from "../../utils/redirect";
import { SignInForm } from "../sign-in-form/sign-in-form";

type SignInDialogProps = {
  open: boolean;
  onClose: () => void;
  /**
   * Runs after an email sign-in. The dialog stays on the page, so callers can
   * finish what the visitor started (a vote, a comment) once the session lands.
   * Defaults to closing the dialog.
   */
  onSignedIn?: () => void;
  title?: string;
  subtitle?: string;
};

/**
 * The /sign-in form in a modal. Email sign-in never leaves the page; Google
 * (a full redirect) comes back to the exact URL the visitor was on.
 */
export function SignInDialog({
  open,
  onClose,
  onSignedIn = onClose,
  title = "Bem-vindo de volta!",
  subtitle = "Inicia sessão na tua conta",
}: SignInDialogProps) {
  const { href } = useLocation();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      hideHeader
      className="max-w-md"
    >
      <div className="relative">
        <button
          type="button"
          aria-label="Fechar"
          onClick={onClose}
          className="absolute -top-1 -right-1 flex size-11 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:size-8"
        >
          <X className="size-4" />
        </button>
        <SignInForm
          variant="dialog"
          title={title}
          subtitle={subtitle}
          redirectTo={safeRedirect(href)}
          onSignedIn={onSignedIn}
        />
      </div>
    </Dialog>
  );
}
