import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Linz Car Selling - Luxury Used Cars in Austria" },
      { name: "description", content: "Drive your dream. Premium pre-owned vehicles in Linz, Upper Austria." },
      { property: "og:title", content: "Linz Car Selling - Luxury Used Cars in Austria" },
      { property: "og:description", content: "Drive your dream. Premium pre-owned vehicles in Linz." },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/linz-motors-logo.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "/linz-motors-logo.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Orbitron:wght@500;600;700;800&display=swap" },
      { rel: "stylesheet", href: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" },
      { rel: "stylesheet", href: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const puterInitScript = `
    (function () {
      const apiKey = ${JSON.stringify(import.meta.env.VITE_PUTER_API_KEY ?? "")};

      window.PUTER_API_ORIGIN = "https://api.puter.com";
      window.PUTER_ORIGIN = "https://puter.com";
      window.puter = window.puter ?? {};

      function configureLocalAuth() {
        if (!apiKey) {
          return;
        }

        try {
          localStorage.setItem("puter.auth.token.v2", apiKey);
          localStorage.setItem("puter.auth.token.origin.v2", window.PUTER_API_ORIGIN);
          localStorage.setItem("puter.auth.token", apiKey);
        } catch (error) {
          console.warn("Unable to write Puter auth token to localStorage.", error);
        }
      }

      function hydratePuterAuth() {
        if (!apiKey || !window.puter) {
          return;
        }

        if (typeof window.puter.setAPIOrigin === "function") {
          try {
            window.puter.setAPIOrigin(window.PUTER_API_ORIGIN);
          } catch (error) {
            console.warn("Unable to set Puter API origin on puter runtime.", error);
          }
        }

        if (typeof window.puter.setAuthToken === "function") {
          try {
            window.puter.setAuthToken(apiKey);
          } catch (error) {
            console.warn("Unable to call Puter.setAuthToken after runtime load.", error);
          }
        } else {
          window.puter.authToken = apiKey;
        }
      }

      function resolvePuterReady(resolve) {
        if (window.puter?.ai?.chat) {
          resolve(window.puter);
          return true;
        }
        return false;
      }

      window.puterReady = new Promise((resolve) => {
        configureLocalAuth();

        const script = document.createElement("script");
        script.src = "https://js.puter.com/v2/";
        script.async = true;
        script.onload = function () {
          hydratePuterAuth();
          if (!resolvePuterReady(resolve)) {
            const checker = setInterval(() => {
              if (resolvePuterReady(resolve)) {
                clearInterval(checker);
              }
            }, 50);
          }
        };
        script.onerror = function () {
          console.error("Failed to load Puter.js runtime.");
        };
        document.head.appendChild(script);

        resolvePuterReady(resolve);
      });
    })();
  `;

  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: puterInitScript }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}

