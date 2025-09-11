# Sortify - your best friend for weekly updates

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js Badge">
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React Badge">
  <img src="https://img.shields.io/badge/Spotify-1ED760?style=for-the-badge&logo=spotify&logoColor=white" alt="Spotify Badge">
</p>

## How was this project born?

As a teen, I discovered French rap songs with both underground and mainstream rappers and fell in love with them. So much so that I developed a habit: every Friday, I would look for new albums, new artists, new genres, in order to put them in a big playlist, sorted by weekly preferences.  
8ruki's album could have a single that I loved at the top of it, then followed by a Femtogo warfare music single. Why not a TKKF hyperpop track after that? And then another 8ruki song...  
I was sorting them one by one, listening to them through short samples. That's why I thought about making an application to help me with this process.

## Key features

### Spotify integration

With the help of the Spotify API, the application will be able to extract a base playlist that Spotify/you have made, unsorted. Then help you with an algorithm to sort those songs and create a brand new sorted playlist, tuned to your vibe.

### React for Front

Using React, the application provides a fast and interactive user interface. It allows users to easily browse, preview, and sort songs in real time, making the playlist creation process smooth and enjoyable. React's component-based architecture also makes it easy to maintain and extend the app with new features.

The UI leverages Tailwind CSS (v4) with a custom glassmorphic design inspired by Spotify's color system. Light & dark themes are supported automatically with a manual toggle in the header.

### Node.js for Back

Node.js powers the backend of the application, handling requests between the frontend and the Spotify API. It manages user authentication, playlist data processing, and implements the sorting algorithm. Node.js ensures fast and scalable server-side operations, making the app responsive and reliable.

### Sort algorithms and options

Several sorting methods are planned to help you organize your playlist according to your preferences:

- **Comparative voting:** The app shows you two songs side by side and asks, "Which one do you prefer?". This comparative voting system allows you to gradually build a ranking of your favorite tracks based on your choices.
- **Prime song selection:** You can elect a "prime" song, instantly propelling it to the top of your playlist.
- **Delete unwanted songs:** If a track really doesn't fit your vibe ("shitass song"), you can remove it from the final playlist with a single click.

Other sorting algorithms and options may be considered in the future to further personalize and improve your playlist experience.

## Current UI / Route Overview

| Route    | Purpose                                                                   |
| -------- | ------------------------------------------------------------------------- |
| `/`      | Landing / marketing hero + CTA (login or open dashboard)                  |
| `/login` | Spotify OAuth initiation (redirects to `/app` if already authed)          |
| `/app`   | Authenticated dashboard: playlist list + track table + 30s preview player |

### Dashboard Features

- Left sidebar lists up to 50 of your playlists (fetch via Spotify API).
- Selecting a playlist loads its first 100 tracks (extendable later with pagination).
- Each track exposes a Play/Pause button if a 30s `preview_url` is available.
- Audio playback is native `<audio>` with simple state; replaceable by the Web Playback SDK later.
- Responsive layout with graceful fallback when no playlist is selected.

### Theming

- Automatically syncs with system theme (prefers-color-scheme)
- Manual toggle (sun/moon) forces light/dark and persists in `localStorage`
- Uses layered radial gradients + backdrop blur for depth; Spotify green gradients for accents

## Authentication Flow

1. User clicks "Login with Spotify" ( `/auth/login` server route -> Spotify authorize endpoint )
2. Spotify redirects back to `SPOTIFY_REDIRECT_URI` with `code`
3. Server exchanges code for tokens, then redirects to `/#access_token=...`
4. Frontend extracts the `access_token` from the hash, stores it in `localStorage`, and context hydrates
5. Authenticated routes (`/app`) read the token from context

## Preview Playback Note

For now only the public 30‑second `preview_url` is used. Some tracks (especially region‑locked or unreleased) do not provide previews – those show a "No preview" indicator. Future enhancement: use the Web Playback SDK for full playback where user scope & premium status allow.

## Development setup

```pwsh
git clone https://github.com/bitroch56/Sortify.git && cd Sortify
pnpm i
```

Create a `.env` file in the root directory and add your Spotify API credentials:

```env
BACKEND_PORT=5000
FRONTEND_PORT=3000
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:5000/callback
```

NOTE: Ensure the redirect URI matches one registered in your Spotify dashboard. For the current code it defaults internally to `http://localhost:5000/auth/callback` if not set.

Then, run the development server:

```pwsh
pnpm dev
```

Then open the app (frontend dev server) in your browser, typically at:

http://localhost:3000

Login, pick a playlist, and start previewing.

## Roadmap (Short-Term)

- [ ] Pagination / infinite scroll for tracks
- [ ] Sorting interaction prototypes (pairwise comparison UI)
- [ ] Persisted user settings (preferred sorting mode)
- [ ] Improved error states + skeleton loaders
- [ ] Web Playback SDK integration for full-track streaming

## Tech Stack Summary

- React Router v7 (file-based routes)
- Fastify v5 backend with lightweight proxy + Spotify OAuth
- Tailwind CSS v4
- TypeScript
- Axios helper layer

## Contributing

PRs welcome. Run lint & type checks before pushing:

```pwsh
pnpm lint
pnpm typecheck
```
