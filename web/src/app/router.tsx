import { Onboarding } from "@/modules/onboarding";
import { ForceOnboarding } from "@/modules/onboarding/components/force-onboarding/force-onboarding";
import { Profile } from "@/modules/profile";
import { ClerkProvider, Protect } from "@clerk/react-router";
import { Center } from "@mantine/core";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { env } from "./env";
import { Landing } from "./pages/landing/landing";

export const PathConstants = {
  root: "/",
  profile: "/perfil",
  onboarding: "/onboarding",
} as const;

function RedirectHome() {
  return <Navigate to={PathConstants.root} replace />;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <ClerkProvider
        publishableKey={env.CLERK_PUBLISHABLE_KEY}
        afterSignOutUrl="/"
        signInFallbackRedirectUrl={PathConstants.profile}
      >
        <Routes>
          <Route path={PathConstants.root} element={<Landing />} />

          <Route
            path={PathConstants.profile}
            element={
              <Protect fallback={<RedirectHome />}>
                <ForceOnboarding>
                  <Profile />
                </ForceOnboarding>
              </Protect>
            }
          />

          <Route
            path={PathConstants.onboarding}
            element={
              <Protect fallback={<RedirectHome />}>
                <Onboarding />
              </Protect>
            }
          />

          <Route path="*" element={<Center>Not Found</Center>} />
        </Routes>
      </ClerkProvider>
    </BrowserRouter>
  );
}
