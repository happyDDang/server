import { getCorsHeaders } from "./cors.ts";

export function jsonResponse(data: any, status = 200, req?: Request) {
  const origin = req?.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin || null);

  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function errorResponse(message: string, status = 400, req?: Request) {
  return jsonResponse({ error: message }, status, req);
}

export function successResponse(message: string, req?: Request) {
  return jsonResponse({ success: true, message }, 200, req);
}