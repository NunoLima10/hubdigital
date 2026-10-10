import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { authClient } from "@/lib/auth-client";
import { DashboardPage } from "@/modules/dashboard/components/dashboard-page/dashboard-page";
import { Profile } from "@/modules/dashboard/components/profile/profile";
import { ProfileForm } from "@/modules/makers/components/profile-form/profile-form";
import { PreferencesForm } from "@/modules/onboarding/components/preferences-form/preferences-form";
import { createFileRoute } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authed/dashboard/profile")({
  component: RouteComponent,
});

function RouteComponent() {
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  function signOut() {
    setIsSigningOut(true);
    void authClient.signOut().then(() => {
      window.location.href = "/";
    });
  }

  return (
    <DashboardPage>
      <section aria-label="Conta" className="border-b pb-6">
        <Profile />
      </section>
      <ProfileForm />
      <section aria-labelledby="preferences-title" className="space-y-5 border-t pt-6">
        <div>
          <h2 id="preferences-title" className="font-semibold">Preferências</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Atualiza as respostas que deste ao entrar no HubDigital.
          </p>
        </div>
        <PreferencesForm />
      </section>
      <section className="border-t pt-6">
        <h2 className="font-semibold">Sessão</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Termina a sessão da tua conta neste dispositivo.
        </p>
        <Button
          type="button"
          variant="destructive"
          className="mt-4"
          onClick={() => setConfirmSignOut(true)}
        >
          <LogOut />
          Terminar sessão
        </Button>
      </section>
      <Dialog
        open={confirmSignOut}
        onClose={() => {
          if (!isSigningOut) setConfirmSignOut(false);
        }}
        title="Terminar sessão"
      >
        <p className="text-sm text-muted-foreground">
          Tens a certeza de que queres terminar a sessão neste dispositivo?
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isSigningOut}
            onClick={() => setConfirmSignOut(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isSigningOut}
            onClick={signOut}
          >
            <LogOut />
            {isSigningOut ? "A terminar..." : "Terminar sessão"}
          </Button>
        </div>
      </Dialog>
    </DashboardPage>
  );
}
