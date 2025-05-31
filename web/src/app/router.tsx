import { ClerkProvider } from "@clerk/react-router";
import { Center } from "@mantine/core";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { env } from "./env";
import { Landing } from "./pages/landing/landing";

export const PathConstants = {
  root: "/",
  profile: "perfil",
} as const;

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
            element={<Center>Perfil</Center>}
          />

          <Route path="*" element={<Center>Not Found</Center>} />
        </Routes>
      </ClerkProvider>
    </BrowserRouter>
  );
}
