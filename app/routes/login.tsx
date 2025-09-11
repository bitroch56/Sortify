import { useEffect } from "react"

import { useAuth } from "../context"
import { useNavigate } from "react-router"

export function meta() {
  return [{ title: "Login - Sortify" }, { name: "robots", content: "noindex" }]
}

export default function LoginPage() {
  const { authenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (authenticated) {
      navigate("/app", { replace: true })
    }
  }, [authenticated, navigate])

  return (
    <main className="flex flex-col items-center justify-center px-6 pb-24 pt-24">
      <div className="relative w-full max-w-md rounded-2xl border border-white/15 bg-white/50 dark:bg-white/5 p-10 backdrop-blur-xl shadow-xl">
        <div
          className="absolute -inset-px rounded-2xl bg-gradient-to-br from-spotify/40 to-spotify-accent/40 opacity-60 blur-xl"
          aria-hidden
        />
        <div className="relative">
          <h1 className="text-3xl font-semibold tracking-tight mb-3 bg-gradient-to-r from-spotify to-spotify-accent bg-clip-text text-transparent">
            Welcome back
          </h1>
          <p className="text-sm text-foreground/70 mb-8">
            Authenticate with your Spotify account to access your playlists &
            previews.
          </p>
          <a
            href="/auth/login"
            className="group relative inline-flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-spotify to-spotify-accent px-6 py-4 font-medium text-white shadow-lg shadow-spotify/30 transition hover:shadow-xl"
          >
            <span className="relative z-10">Login with Spotify</span>
            <span className="absolute inset-0 opacity-0 transition group-hover:opacity-100 bg-gradient-to-r from-spotify-accent to-spotify" />
          </a>
        </div>
      </div>
    </main>
  )
}
