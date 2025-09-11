import type { Route } from "./+types/index"

import { Home } from "../pages/home"

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sortify" },
    {
      name: "description",
      content:
        "Web App using the Spotify's API to help you sort playlist depending on your music tastes. Create a playlist with multiples songs, listen to a preview of your songs and give them an appreciation.",
    },
  ]
}

export default function Index() {
  return <Home />
}
