import "dotenv/config"

import Fastify from "fastify"
import proxyPlugin from "./plugins/proxy"

import { randomBytes } from "crypto"

const PORT = Number(process.env.BACKEND_PORT) || 5000
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || ""
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || ""
const SPOTIFY_REDIRECT_URI =
  process.env.SPOTIFY_REDIRECT_URI || "http://localhost:5000/auth/callback"

const app = Fastify({
  logger: true,
})
await app.register(proxyPlugin)

// Function to generate a random string for state parameter
function generateRandomString(length: number): string {
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  return Array.from(
    randomBytes(length),
    (b) => possible[b % possible.length],
  ).join("")
}

// Function to get user ID from Spotify API
async function getUserId(access_token: string): Promise<string> {
  try {
    const res = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    if (!res.ok) {
      throw new Error("Failed to fetch user profile")
    }
    const data = (await res.json()) as { id: string }
    return data.id
  } catch (error) {
    app.log.error(`Error fetching user ID: ${error}`)
    throw error
  }
}

// #region Routes

// Initiate Spotify login
app.get("/auth/login", (_req, reply) => {
  const scope = "streaming user-read-email user-read-private"
  const state = generateRandomString(16)

  const auth_query_parameters = new URLSearchParams({
    response_type: "code",
    client_id: SPOTIFY_CLIENT_ID,
    scope,
    redirect_uri: SPOTIFY_REDIRECT_URI,
    state,
  })

  reply.redirect(
    "https://accounts.spotify.com/authorize?" +
      auth_query_parameters.toString(),
  )
})

interface CallbackQuery {
  code?: string
  state?: string
}

interface TokenResponse {
  access_token: string
  token_type: string
  scope: string
  expires_in: number
  refresh_token?: string
}

// Spotify auth callback
app.get<{ Querystring: CallbackQuery }>(
  "/auth/callback",
  async (req, reply) => {
    const { code, state } = req.query

    if (!state || !code) {
      return reply.redirect(
        "/#" + new URLSearchParams({ error: "state_mismatch" }).toString(),
      )
    }

    try {
      const bodyParams = new URLSearchParams({
        code,
        redirect_uri: SPOTIFY_REDIRECT_URI,
        grant_type: "authorization_code",
      })

      const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(
              `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`,
            ).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: bodyParams.toString(),
      })

      if (!tokenRes.ok) {
        reply.redirect(
          "/#" + new URLSearchParams({ error: "invalid_token" }).toString(),
        )
        return
      }

      const tokenData = (await tokenRes.json()) as TokenResponse
      const { access_token, refresh_token = "" } = tokenData

      reply.redirect(
        "/#" +
          new URLSearchParams({
            access_token,
            // optional
            refresh_token,
          }).toString(),
      )
    } catch (err) {
      req.log.error(err)
      reply.redirect(
        "/#" +
          new URLSearchParams({ error: "token_request_failed" }).toString(),
      )
    }
  },
)

// Access token echo route
app.get<{ Querystring: { access_token?: string } }>(
  "/auth/token",
  (req, reply) => {
    reply.send({ access_token: req.query.access_token })
  },
)

// Basic test route
app.get("/", async (_req, reply) => {
  reply.send("Hello World!")
})

// Get user's playlists
app.get<{ Querystring: { access_token: string } }>(
  "/users/playlists",
  async (req, reply) => {
    const { access_token } = req.query

    if (!access_token) {
      return reply.code(400).send({ error: "Missing access_token" })
    }

    try {
      const url = "https://api.spotify.com/v1/me/playlists?limit=50&offset=0"
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${access_token}` },
      })

      if (!res.ok) {
        const text = await res.text()
        return reply
          .code(res.status)
          .send({ error: "Spotify API error", details: text })
      }

      const data = await res.json()
      reply.send(data)
    } catch (error) {
      req.log.error(`Error fetching user playlists: ${error}`)
      reply.code(500).send({ error: "Failed to fetch playlists" })
    }
  },
)

try {
  await app.listen({ port: PORT })
  console.log(`Server listening on port ${PORT}`)
} catch (err) {
  console.error("Error starting server:", err)
  process.exit(1)
}
