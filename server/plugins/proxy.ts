import fp from "fastify-plugin"
import httpProxy from "@fastify/http-proxy"

import type { FastifyInstance } from "fastify"

export default fp(async function proxyPlugin(fastify: FastifyInstance) {
  await fastify.register(httpProxy, {
    upstream: "http://127.0.0.1:5000",
    prefix: "/auth", // proxy /auth and /auth/**
    replyOptions: {
      // pass through headers if needed
      rewriteRequestHeaders: (_req, headers) => headers,
    },
  })
})
