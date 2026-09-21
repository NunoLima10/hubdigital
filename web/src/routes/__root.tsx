import { AppProvider } from "@/app/provider";
import { ColorSchemeScript, mantineHtmlProps } from "@mantine/core";
import type { QueryClient } from "@tanstack/react-query";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

interface RouterContext {
  queryClient: QueryClient;
}

const description =
  "Um Hub digital de código aberto para impulsionar a inovação em Cabo Verde, meio para descobrir, partilhar e apoiar projetos e produtos criados por caboverdianos";

export const Route = createRootRouteWithContext<RouterContext>()({
  // Site-wide defaults, carried over from the old index.html. Routes that have
  // something more specific to say override them with their own head().
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
      { title: "HubDigital" },
      { name: "description", content: description },
      {
        name: "keywords",
        content:
          "cabo verde, cvd, caboverdedigital, hubdigital, cabo verde tecnologia",
      },
      { name: "author", content: "HubDigital" },
      { property: "og:image", content: "/og.webp" },
      { property: "og:image:alt", content: "og alt" },
    ],
    links: [
      { rel: "icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Geist:wght@100..900&family=Rubik:ital,wght@0,300..900;1,300..900&display=swap",
      },
    ],
  }),
  shellComponent: RootDocument,
  component: RootComponent,
});

function RootComponent() {
  return (
    <AppProvider>
      <Outlet />
    </AppProvider>
  );
}

// The document shell. It renders even when a route throws, which is why the
// html, head and body live here and not in RootComponent.
function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt" {...mantineHtmlProps}>
      <head>
        {/* Applies the saved colour scheme before first paint, so a dark-mode
            visitor is not flashed a light page while React hydrates. */}
        <ColorSchemeScript />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
