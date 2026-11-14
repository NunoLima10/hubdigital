import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.5-.2-2.2H12v4.3h5.4a4.6 4.6 0 0 1-2 3v2.8h3.5c2-1.9 3.2-4.6 3.2-7.9Z" />
      <path fill="#34A853" d="M12 22c2.9 0 5.3-1 7-2.6l-3.5-2.8c-1 .7-2.1 1-3.5 1a6.1 6.1 0 0 1-5.7-4.2H2.7v2.9A10.6 10.6 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.3 13.4a6.3 6.3 0 0 1 0-4V6.5H2.7a10.3 10.3 0 0 0 0 9.8l3.6-2.9Z" />
      <path fill="#EA4335" d="M12 5.2c1.6 0 3.1.6 4.2 1.7l3.1-3A10.4 10.4 0 0 0 2.7 6.4l3.6 2.9A6.1 6.1 0 0 1 12 5.2Z" />
    </svg>
  );
}

export function GoogleSignInButton() {
  const [isPending, setIsPending] = useState(false);

  async function signInWithGoogle() {
    setIsPending(true);

    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: `${window.location.origin}/dashboard/releases`,
      });

      if (error) {
        toast.error("Não foi possível iniciar sessão com o Google");
        setIsPending(false);
      }
    } catch {
      toast.error("Não foi possível iniciar sessão com o Google");
      setIsPending(false);
    }
  }

  return (
    <Button type="button" variant="outline" className="w-full" disabled={isPending} onClick={signInWithGoogle}>
      <GoogleIcon />
      {isPending ? "A redirecionar..." : "Continuar com Google"}
    </Button>
  );
}
