import { type RouteConfig, index, route } from "@react-router/dev/routes"

// Route structure:
// /            -> landing page (marketing / CTA)
// /login       -> login page (redirects if already authed)
// /app         -> authenticated dashboard (playlists + player)
export default [
  index("routes/index.tsx"),
  route("login", "routes/login.tsx"),
  route("app", "routes/app.tsx"),
] satisfies RouteConfig
