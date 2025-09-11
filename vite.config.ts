import "dotenv/config"

import tailwindcss from "@tailwindcss/vite"
import tsconfigPaths from "vite-tsconfig-paths"

import { reactRouter } from "@react-router/dev/vite"
import { defineConfig } from "vite"

const FRONTEND_PORT = Number(process.env.FRONTEND_PORT) || 3000

export default defineConfig({
  build: {
    cssMinify: "lightningcss",
  },
  clearScreen: false,
  esbuild: {
    target: "es2022",
  },
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  preview: {
    port: FRONTEND_PORT,
  },
  server: {
    port: FRONTEND_PORT,
  },
})
