import { handleCorsPreflightRequest } from "./utils/cors.ts";
import { errorResponse } from "./utils/response.ts";
import { handleCheckNickname } from "./routes/member.ts";
import { handleRegisterRanking, handleFetchRankings } from "./routes/ranking.ts";
import { SERVER_PORT } from "./config/constants.ts";

async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  const url = new URL(req.url);
  const path = url.pathname;

  try {
    if (path === "/member" && req.method === "POST") {
      return await handleCheckNickname(req);
    }

    if (path === "/rank" && req.method === "POST") {
      return await handleRegisterRanking(req);
    }

    if (path === "/rank" && req.method === "GET") {
      return await handleFetchRankings(url, req);
    }

    return errorResponse("API를 찾을 수 없습니다.", 404, req);
  } catch (error) {
    console.error("서버 오류:", error);
    return errorResponse("서버 내부 오류가 발생했습니다.", 500, req);
  }
}

console.log("🚀 게임 랭킹 서버가 실행중입니다!");
Deno.serve({ port: SERVER_PORT }, handler);