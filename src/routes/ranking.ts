import {
  registerPlayerRanking,
  fetchRankings,
} from "../services/rankingService.ts";
import {
  jsonResponse,
  errorResponse,
  successResponse,
} from "../utils/response.ts";
import {withApiLogging, createLogContext} from "../utils/middleware.ts";
import {logger} from "../utils/logger.ts";

async function _handleRegisterRanking(req: Request): Promise<Response> {
  const logContext = createLogContext(req);

  try {
    const requestBody = await req.json();
    const {member_no, nickname, score} = requestBody;

    if (!member_no || !nickname || score === undefined) {
      logger.warn("Invalid ranking registration parameters", {
        ...logContext,
        receivedData: {member_no, nickname, score},
      });
      return errorResponse(
        "필수 파라미터가 누락되었습니다. (member_no, nickname, score 필요)",
        400,
        req
      );
    }

    if (typeof score !== "number" || score < 0) {
      logger.warn("Invalid score value", {
        ...logContext,
        score: score,
        scoreType: typeof score,
      });
      return errorResponse("점수는 0 이상의 숫자여야 합니다.", 400, req);
    }

    logger.info("Registering player ranking", {
      ...logContext,
      member_no,
      nickname,
      score,
    });

    await registerPlayerRanking(member_no, nickname, score);

    logger.info("Player ranking registered successfully", {
      ...logContext,
      member_no,
      nickname,
      score,
    });

    return successResponse("랭킹 등록 완료!", req);
  } catch (e) {
    const error = e as Error;
    const status = error.message === "이미 등록된 닉네임입니다." ? 409 : 400;

    logger.error("Error registering player ranking", error, {
      ...logContext,
      errorType: status === 409 ? "duplicate_nickname" : "registration_error",
    });

    return errorResponse(error.message, status, req);
  }
}

async function _handleFetchRankings(req: Request): Promise<Response> {
  const logContext = createLogContext(req);

  try {
    const url = new URL(req.url);
    const memberNo = url.searchParams.get("member_no");
    const topRankSizeParam = url.searchParams.get("top_rank_size");
    const topRankSize = parseInt(topRankSizeParam || "7");

    if (isNaN(topRankSize) || topRankSize <= 0 || topRankSize > 100) {
      logger.warn("Invalid top_rank_size parameter", {
        ...logContext,
        topRankSizeParam,
        parsedValue: topRankSize,
      });
      return errorResponse(
        "top_rank_size는 1-100 사이의 숫자여야 합니다.",
        400,
        req
      );
    }

    logger.info("Fetching rankings", {
      ...logContext,
      memberNo: memberNo || "all",
      topRankSize,
    });

    const result = await fetchRankings(memberNo || undefined, topRankSize);

    logger.info("Rankings fetched successfully", {
      ...logContext,
      memberNo: memberNo || "all",
      topRankSize,
      resultCount: result.top_rank?.length || 0,
      hasUserRank: !!result.my_rank,
    });

    return jsonResponse(
      {
        value: result,
      },
      200,
      req
    );
  } catch (e) {
    const error = e as Error;
    logger.error("Error fetching rankings", error, {
      ...logContext,
    });
    return errorResponse("랭킹 조회 중 오류가 발생했습니다.", 500, req);
  }
}

export const handleRegisterRanking = withApiLogging(
  "handleRegisterRanking",
  _handleRegisterRanking
);
export const handleFetchRankings = withApiLogging(
  "handleFetchRankings",
  _handleFetchRankings
);
