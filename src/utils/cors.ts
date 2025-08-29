import {ALLOWED_ORIGINS} from "../config/constants.ts";
import { logger } from "./logger.ts";

export function getCorsHeaders(origin: string | null) {
  const allowedOrigin =
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    logger.warn("CORS request from non-allowed origin", {
      requestedOrigin: origin,
      allowedOrigins: ALLOWED_ORIGINS,
      fallbackOrigin: allowedOrigin,
    });
  }

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export function handleCorsPreflightRequest(req: Request): Response {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  logger.debug("Handling CORS preflight request", {
    origin: origin || "none",
    allowedOrigin: corsHeaders["Access-Control-Allow-Origin"],
  });

  return new Response(null, {headers: corsHeaders});
}
