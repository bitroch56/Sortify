import { useState, useEffect } from "react"

// inb4 we get the Spotify sdk added
declare global {
  interface Window {
    Spotify: any
    onSpotifyWebPlaybackSDKReady: (() => void) | undefined
  }
}

interface WebPlaybackProps {
  token: string
}

function WebPlayback(props: WebPlaybackProps) {
  const [player, setPlayer] = useState<undefined>(undefined)

  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://sdk.scdn.co/spotify-player.js"
    script.async = true

    document.body.appendChild(script)

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: "Web Playback SDK",
        getOAuthToken: (cb: (token: string) => void) => {
          cb(props.token)
        },
        volume: 0.5,
      })

      setPlayer(player)

      player.addListener("ready", ({ device_id }: { device_id: string }) => {
        console.log("Ready with Device ID", device_id)
      })

      player.addListener(
        "not_ready",
        ({ device_id }: { device_id: string }) => {
          console.log("Device ID has gone offline", device_id)
        },
      )

      player.connect()
    }
  }, [props.token])

  return (
    <>
      <div className="container">
        <div className="main-wrapper">
          {player ? (
            <p>Spotify Player initialized!</p>
          ) : (
            <p>Loading player...</p>
          )}
        </div>
      </div>
    </>
  )
}

export default WebPlayback
