import type { Route } from "./+types/index"
import { NavLink } from "react-router"
import { useAuth } from "../context"

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "Sortify - Organize Your Sound" },
    {
      name: "description",
      content:
        "Curate, preview & sort your Spotify playlists intelligently with a sleek web interface.",
    },
  ]
}

export default function Index() {
  const { authenticated } = useAuth()
  return (
    <main className="relative">
      <div className="mx-auto max-w-7xl px-6 pb-32 pt-28 sm:pt-36">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-medium tracking-wide text-foreground/80 backdrop-blur-md">
            <span className="h-2 w-2 animate-pulse rounded-full bg-spotify-accent" />
            Live Preview Build
          </span>
          <h1 className="mt-8 text-5xl font-semibold leading-tight tracking-tight md:text-6xl">
            <span className="bg-gradient-to-br from-white via-white to-white/60 bg-clip-text text-transparent dark:from-white dark:via-white dark:to-white/70">
              Elevate your playlists.
            </span>
            <br />
            <span className="bg-gradient-to-r from-spotify to-spotify-accent bg-clip-text text-transparent">
              Feel the flow.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-foreground/70">
            Sortify lets you browse playlists, audition track previews, and
            craft the perfect vibe—all in a refined, fast, minimal interface
            inspired by the beauty of sound.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <NavLink
              to={authenticated ? "/app" : "/login"}
              className="group relative inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-spotify to-spotify-accent px-8 py-4 text-base font-semibold text-white shadow-lg shadow-spotify/30 transition hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-spotify-accent/50"
            >
              {authenticated ? "Open Dashboard" : "Login with Spotify"}
            </NavLink>
            <a
              href="https://developer.spotify.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-4 text-sm font-medium text-foreground/80 backdrop-blur-sm transition hover:bg-white/10"
            >
              Spotify API ↗
            </a>
          </div>
        </div>
      </div>
      <BackgroundDecor />
    </main>
  )
}

function BackgroundDecor() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="absolute -top-32 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-spotify/30 blur-[160px]" />
      <div className="absolute top-1/3 -left-40 h-96 w-96 rounded-full bg-spotify-accent/20 blur-[140px]" />
      <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-emerald-500/10 blur-[120px]" />
    </div>
  )
}
