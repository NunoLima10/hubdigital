import { AppProvider } from "@/app/provider";
import "@/index.css";
// The Latin subset of Inter (covers Portuguese). Same hashed file the CSS
// @font-face points at, so the preload below is the request the page uses.
import interLatinWoff2 from "@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url";
import { analyticsScripts } from "@/lib/analytics";
import { seo } from "@/lib/seo";
import { BadgeCelebration } from "@/modules/badges/components/badge-celebration";
import { LaunchGate } from "@/modules/launch/components/launch-gate/launch-gate";
import { launchStatusQueryOptions } from "@/modules/launch/hooks/use-launch-status";
import { ProjectBadgeCelebration } from "@/modules/project-badges/components/project-badge-celebration";
import { discoverySearchSchema } from "@/modules/project-list/search-params";
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

export const Route = createRootRouteWithContext<RouterContext>()({
  validateSearch: discoverySearchSchema,
  // The pre-launch lock, known before the first render so the server already
  // sends the countdown instead of the site (see LaunchGate).
  loader: ({ context }) => context.queryClient.ensureQueryData(launchStatusQueryOptions()),
  // Site-wide defaults. Routes that have something more specific to say
  // override them with their own head(), built from the same seo() helper.
  head: ({ loaderData }) => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
      { name: "theme-color", content: "#0a0a0a" },
      {
        name: "keywords",
        content:
          "Cabo Verde, projetos digitais, startups, produtos, makers, tecnologia, inovação, open source, Hub Digital",
      },
      { name: "author", content: "Hub Digital" },
      // Installed app (PWA): name and status bar when added to the home screen.
      { name: "application-name", content: "Hub Digital" },
      { name: "apple-mobile-web-app-title", content: "Hub Digital" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      {
        name: "apple-mobile-web-app-status-bar-style",
        content: "black-translucent",
      },
      ...seo({}).meta,
      // While locked every URL shows the countdown; keep it out of search.
      ...(loaderData?.locked ? [{ name: "robots", content: "noindex" }] : []),
    ],
    links: [
      // Fetch Inter with the HTML instead of after the CSS is parsed, so the
      // first paint already uses it rather than swapping from a system font.
      {
        rel: "preload",
        href: interLatinWoff2,
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
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
    scripts: analyticsScripts(),
  }),
  shellComponent: RootDocument,
  component: RootComponent,
});

function RootComponent() {
  return (
    <AppProvider>
      <LaunchGate>
        <Outlet />
        <BadgeCelebration />
        <ProjectBadgeCelebration />
      </LaunchGate>
    </AppProvider>
  );
}

// The document shell. It renders even when a route throws, which is why the
// html, head and body live here and not in RootComponent.
function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html:
              ":root{background:#fff;color-scheme:light}.dark{background:#171717;color-scheme:dark}",
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{const t=localStorage.getItem('hubdigital-theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch{}`,
          }}
        />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
        {import.meta.env.PROD && (
          // Service worker (public/sw.js): installable app + offline page.
          // Production only, so dev never serves stale files from its cache.
          <script
            dangerouslySetInnerHTML={{
              __html: `if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}))`,
            }}
          />
        )}
      </body>
    </html>
  );
}
