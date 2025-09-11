import { useEffect, useState, useCallback, useRef } from "react"
import { useAuth } from "../context"
import { useNavigate } from "react-router"

interface SpotifyImage {
  url: string
  width: number
  height: number
}
interface Playlist {
  id: string
  name: string
  images?: SpotifyImage[]
  tracks: { total: number }
  description?: string
}
interface TrackItem {
  track: {
    id: string
    name: string
    preview_url: string | null
    artists: { name: string }[]
    album: { images?: SpotifyImage[] }
  }
}

export function meta() {
  return [{ title: "Dashboard - Sortify" }]
}

export default function DashboardPage() {
  const { token, authenticated } = useAuth()
  const navigate = useNavigate()
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loadingPlaylists, setLoadingPlaylists] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(
    null,
  )
  const [tracks, setTracks] = useState<TrackItem[]>([])
  const [loadingTracks, setLoadingTracks] = useState(false)
  const [currentPreview, setCurrentPreview] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!authenticated) {
      navigate("/login")
    }
  }, [authenticated, navigate])

  const fetchPlaylists = useCallback(async () => {
    if (!token) {
      return
    }
    try {
      setLoadingPlaylists(true)
      setError(null)
      const res = await fetch(`/users/playlists?access_token=${token}`)
      if (!res.ok) {
        throw new Error(`Failed: ${res.status}`)
      }
      const data = await res.json()
      setPlaylists(data.items || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoadingPlaylists(false)
    }
  }, [token])

  useEffect(() => {
    fetchPlaylists()
  }, [fetchPlaylists])

  const fetchTracks = useCallback(
    async (playlist: Playlist) => {
      if (!token) {
        return
      }
      try {
        setLoadingTracks(true)
        setTracks([])
        const res = await fetch(
          `/playlists/${playlist.id}/tracks?access_token=${token}`,
        )
        if (!res.ok) {
          throw new Error("Failed to load tracks")
        }
        const data = await res.json()
        setTracks(data.items || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoadingTracks(false)
      }
    },
    [token],
  )

  const selectPlaylist = (pl: Playlist) => {
    setSelectedPlaylist(pl)
    fetchTracks(pl)
  }

  const togglePreview = (url: string | null) => {
    if (!url) {
      return
    }
    const audio = audioRef.current
    if (currentPreview === url && audio) {
      audio.pause()
      setCurrentPreview(null)
    } else {
      if (audio) {
        audio.src = url
        audio.currentTime = 0
        audio.play().catch(console.error)
        setCurrentPreview(url)
      }
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 pb-24">
      <div className="grid lg:grid-cols-[300px_1fr] gap-10">
        <aside className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/70">
              Playlists
            </h2>
            <button
              onClick={fetchPlaylists}
              className="text-xs rounded-md px-2 py-1 bg-white/10 hover:bg-white/20"
            >
              ↻
            </button>
          </div>
          <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
            {loadingPlaylists && (
              <p className="text-xs text-foreground/60 animate-pulse">
                Loading…
              </p>
            )}
            {error && <p className="text-xs text-red-400">{error}</p>}
            {playlists.map((pl) => (
              <button
                key={pl.id}
                onClick={() => {
                  selectPlaylist(pl)
                }}
                className={`group text-left rounded-xl p-3 transition border border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 backdrop-blur-sm flex gap-3 items-center ${selectedPlaylist?.id === pl.id ? "ring-2 ring-spotify/60" : ""}`}
              >
                <img
                  src={pl.images?.[0]?.url || ""}
                  alt=""
                  className="h-12 w-12 rounded-md object-cover bg-black/30"
                />
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-sm">{pl.name}</p>
                  <p className="text-[10px] uppercase tracking-wide text-foreground/50">
                    {pl.tracks.total} tracks
                  </p>
                </div>
              </button>
            ))}
          </div>
        </aside>
        <section className="space-y-8">
          {selectedPlaylist ? (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-end gap-6">
                <img
                  src={selectedPlaylist.images?.[0]?.url || ""}
                  alt=""
                  className="h-40 w-40 rounded-xl object-cover shadow-2xl shadow-black/50"
                />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
                    Playlist
                  </p>
                  <h1 className="text-4xl font-semibold tracking-tight mt-1 bg-gradient-to-r from-spotify to-spotify-accent bg-clip-text text-transparent">
                    {selectedPlaylist.name}
                  </h1>
                  {selectedPlaylist.description && (
                    <p
                      className="mt-3 text-sm text-foreground/70 line-clamp-2"
                      dangerouslySetInnerHTML={{
                        __html: selectedPlaylist.description,
                      }}
                    />
                  )}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wide text-foreground/60">
                    <tr>
                      <th className="px-4 py-3 w-12">#</th>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3">Artist</th>
                      <th className="px-4 py-3 w-32">Preview</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingTracks && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-6 text-center text-foreground/50"
                        >
                          Loading tracks…
                        </td>
                      </tr>
                    )}
                    {!loadingTracks &&
                      tracks.map((item, idx) => {
                        const t = item.track
                        return (
                          <tr
                            key={t.id}
                            className="group border-t border-white/5 hover:bg-white/5/50"
                          >
                            <td className="px-4 py-2 text-xs text-foreground/50">
                              {idx + 1}
                            </td>
                            <td className="px-4 py-2 font-medium truncate max-w-[240px]">
                              {t.name}
                            </td>
                            <td className="px-4 py-2 text-foreground/60 truncate max-w-[160px]">
                              {t.artists.map((a) => a.name).join(", ")}
                            </td>
                            <td className="px-4 py-2">
                              {t.preview_url ? (
                                <button
                                  onClick={() => {
                                    togglePreview(t.preview_url)
                                  }}
                                  className={`text-xs px-3 py-1 rounded-full border border-white/15 transition ${currentPreview === t.preview_url ? "bg-gradient-to-r from-spotify to-spotify-accent text-white" : "bg-white/5 hover:bg-white/10 text-foreground/70"}`}
                                >
                                  {currentPreview === t.preview_url
                                    ? "Pause"
                                    : "Play"}
                                </button>
                              ) : (
                                <span className="text-[10px] text-foreground/40">
                                  No preview
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-32 text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-spotify/30 to-spotify-accent/30 mb-8 flex items-center justify-center">
                <span className="text-4xl">🎧</span>
              </div>
              <h2 className="text-2xl font-semibold tracking-tight mb-3">
                Choose a playlist
              </h2>
              <p className="max-w-sm text-sm text-foreground/60">
                Select a playlist from the left to explore tracks and play
                30‑second previews instantly.
              </p>
            </div>
          )}
        </section>
      </div>
      <audio
        ref={audioRef}
        onEnded={() => {
          setCurrentPreview(null)
        }}
        className="hidden"
      />
    </div>
  )
}
