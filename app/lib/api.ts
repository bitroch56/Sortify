import axios from "axios"

export interface PlaylistSummary {
  id: string
  name: string
  images?: { url: string }[]
  tracks: { total: number }
  description?: string
}
export interface TrackItem {
  track: {
    id: string
    name: string
    preview_url: string | null
    artists: { name: string }[]
    album: { images?: { url: string }[] }
  }
}

export async function getPlaylists(token: string) {
  const res = await axios.get(`/users/playlists?access_token=${token}`)
  return res.data
}

export async function getPlaylistTracks(token: string, id: string) {
  const res = await axios.get(`/playlists/${id}/tracks?access_token=${token}`)
  return res.data
}
