import {ALLOWED_ORIGINS} from "../config/constants.ts";
import { logger } from "./logger.ts";

export function getCorsHeaders(origin: string | null) {
  // Origin이 허용 목록에 있으면 그대로 사용, 없으면 와일드카드
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : "*";

  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    logger.warn("CORS request from non-allowed origin, allowing with wildcard", {
      requestedOrigin: origin,
      allowedOrigins: ALLOWED_ORIGINS,
      usingWildcard: true,
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
