import {checkNicknameDuplicate} from "../services/memberService.ts";
import {jsonResponse, errorResponse} from "../utils/response.ts";

export async function handleCheckNickname(req: Request): Promise<Response> {
  console.log("Checking the duplication of nickname...");

  try {
    const {nickname} = await req.json();
    const result = await checkNicknameDuplicate(nickname);

    return jsonResponse(
      {
        value: result,
      },
      200,
      req
    );
  } catch (e) {
    const error = e as Error;
    return errorResponse(error.message, 400, req);
  }
}
