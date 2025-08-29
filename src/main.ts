import {handleCorsPreflightRequest} from "./utils/cors.ts";
import {errorResponse} from "./utils/response.ts";
import {handleCheckNickname} from "./routes/member.ts";
import {handleRegisterRanking, handleFetchRankings} from "./routes/ranking.ts";
import {SERVER_PORT} from "./config/constants.ts";
import {logger} from "./utils/logger.ts";
import {withLogging, createLogContext} from "./utils/middleware.ts";

async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  const url = new URL(req.url);
  const path = url.pathname;
  const logContext = createLogContext(req);

  try {
    if (path === "/member" && req.method === "POST") {
      return await handleCheckNickname(req);
    }

    if (path === "/rank" && req.method === "POST") {
      return await handleRegisterRanking(req);
    }

    if (path === "/rank" && req.method === "GET") {
      return await handleFetchRankings(req);
    }

    logger.warn("API endpoint not found", {
      ...logContext,
      attemptedPath: path,
    });
    return errorResponse("API를 찾을 수 없습니다.", 404, req);
  } catch (error) {
    const err = error as Error;
    logger.error("Unhandled server error in main handler", err, logContext);
    return errorResponse("서버 내부 오류가 발생했습니다.", 500, req);
  }
}

const wrappedHandler = withLogging(handler);

logger.info("Happy DDang Game Ranking Server starting", {
  port: SERVER_PORT,
  environment: Deno.env.get("DENO_ENV") || "development",
});

Deno.serve({port: SERVER_PORT}, wrappedHandler);
