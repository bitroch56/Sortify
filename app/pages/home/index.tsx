import { useState, useEffect } from "react"

import Login from "~/components/Login"
import WebPlayback from "~/components/WebPlayback"

export function Home() {
  const [token, setToken] = useState("")

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await fetch("/auth/token")
        const json = await response.json()
        setToken(json.access_token)
      } catch (err) {
        console.error("Failed to fetch token", err)
      }
    }
    fetchToken()
  }, [])
  return (
    <main className="flex items-center justify-center pt-16 pb-4">
      <>{token === "" ? <Login /> : <WebPlayback token={token} />}</>
    </main>
  )
}
