import { ALLOWED_ORIGINS } from "../config/constants.ts";

export function getCorsHeaders(origin: string | null) {
  const allowedOrigin =
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export function handleCorsPreflightRequest(req: Request): Response {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);
  
  return new Response(null, { headers: corsHeaders });
}