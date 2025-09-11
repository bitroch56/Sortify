import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  NavLink,
} from "react-router"

import type { Route } from "./+types/root"
import "./app.css"
import { AuthProvider, ThemeProvider, useAuth, useTheme } from "./context"

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
]

const dashLinkClass = (isActive: boolean) =>
  `px-3 py-1.5 rounded-md transition-colors ${isActive ? "bg-spotify-accent/20 text-spotify-accent" : "text-foreground/70 hover:text-foreground"}`

function Header() {
  const { authenticated, logout } = useAuth()
  const { toggle, resolvedTheme } = useTheme()
  return (
    <header className="fixed top-0 inset-x-0 z-40 backdrop-blur-md bg-background/60 border-b border-white/10 dark:border-white/5">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-6">
        <NavLink
          to="/"
          className="text-lg font-semibold tracking-tight text-spotify-accent hover:opacity-90"
        >
          Sortify
        </NavLink>
        <nav className="flex-1 flex items-center gap-4 text-sm">
          <NavLink
            to="/app"
            className={({ isActive }) => dashLinkClass(isActive)}
          >
            Dashboard
          </NavLink>
        </nav>
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-foreground transition"
          >
            {resolvedTheme === "dark" ? "🌙" : "☀️"}
          </button>
          {authenticated ? (
            <button
              onClick={logout}
              className="px-3 py-1.5 rounded-md bg-gradient-to-r from-spotify to-spotify-accent text-white font-medium shadow hover:shadow-lg transition-shadow"
            >
              Logout
            </button>
          ) : (
            <NavLink
              to="/login"
              className="px-3 py-1.5 rounded-md bg-gradient-to-r from-spotify to-spotify-accent text-white font-medium shadow hover:shadow-lg transition-shadow"
            >
              Login
            </NavLink>
          )}
        </div>
      </div>
    </header>
  )
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-full font-sans bg-app-gradient text-foreground antialiased selection:bg-spotify-accent/30">
        <ThemeProvider>
          <AuthProvider>
            <Header />
            <div className="pt-20">{children}</div>
          </AuthProvider>
        </ThemeProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  return <Outlet />
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!"
  let details = "An unexpected error occurred."
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error"
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message
    stack = error.stack
  }

  return (
    <main className="pt-32 p-6 mx-auto max-w-3xl">
      <div className="rounded-2xl border border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-xl p-8 shadow-xl">
        <h1 className="text-4xl font-semibold mb-4 bg-gradient-to-r from-spotify to-spotify-accent bg-clip-text text-transparent">
          {message}
        </h1>
        <p className="text-foreground/80 mb-4">{details}</p>
        {stack && (
          <pre className="w-full p-4 overflow-x-auto text-xs bg-black/60 rounded-lg text-white/90">
            <code>{stack}</code>
          </pre>
        )}
      </div>
    </main>
  )
}
