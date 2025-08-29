import {checkNicknameDuplicate} from "../services/memberService.ts";
import {jsonResponse, errorResponse} from "../utils/response.ts";
import {withApiLogging, createLogContext} from "../utils/middleware.ts";
import {logger} from "../utils/logger.ts";

async function _handleCheckNickname(req: Request): Promise<Response> {
  const logContext = createLogContext(req);

  try {
    const requestBody = await req.json();
    const {nickname} = requestBody;

    if (!nickname || typeof nickname !== "string") {
      logger.warn("Invalid nickname parameter", {
        ...logContext,
        receivedNickname: nickname,
      });
      return errorResponse("닉네임이 필요합니다.", 400, req);
    }

    logger.debug("Checking nickname duplication", {
      ...logContext,
      nickname: nickname,
    });

    const result = await checkNicknameDuplicate(nickname);

    logger.info("Nickname duplication check completed", {
      ...logContext,
      nickname: nickname,
      isDuplicate: result.duplicated,
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
    logger.error("Error in nickname duplication check", error, {
      ...logContext,
    });
    return errorResponse(error.message, 400, req);
  }
}

export const handleCheckNickname = withApiLogging(
  "handleCheckNickname",
  _handleCheckNickname
);
