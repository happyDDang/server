import { registerPlayerRanking, fetchRankings } from "../services/rankingService.ts";
import { jsonResponse, errorResponse, successResponse } from "../utils/response.ts";

export async function handleRegisterRanking(req: Request): Promise<Response> {
  console.log("Registering the ranking...");

  try {
    const { member_no, nickname, score } = await req.json();
    await registerPlayerRanking(member_no, nickname, score);
    
    return successResponse("랭킹 등록 완료!", req);
  } catch (e) {
    const error = e as Error;
    const status = error.message === "이미 등록된 닉네임입니다." ? 409 : 400;
    return errorResponse(error.message, status, req);
  }
}

export async function handleFetchRankings(url: URL, req: Request): Promise<Response> {
  console.log("Fetching the rankings...");

  try {
    const memberNo = url.searchParams.get("member_no");
    const topRankSize = parseInt(url.searchParams.get("top_rank_size") || "7");

    const result = await fetchRankings(memberNo || undefined, topRankSize);
    
    return jsonResponse(
      {
        value: result,
      },
      200,
      req
    );
  } catch (e) {
    console.error("랭킹 조회 오류:", e);
    return errorResponse("랭킹 조회 중 오류가 발생했습니다.", 500, req);
  }
}