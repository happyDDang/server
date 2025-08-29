import {MEMBER_NO_RANGE} from "../config/constants.ts";
import {logger} from "../utils/logger.ts";

const kv = await Deno.openKv();

export async function checkNicknameDuplicate(nickname: string) {
  const trimmedNickname = nickname?.trim();

  if (!trimmedNickname || trimmedNickname === "") {
    logger.warn("Empty nickname provided for duplication check", {nickname});
    throw new Error("닉네임을 입력해주세요.");
  }

  try {
    logger.logDatabaseOperation("get", "players", {nickname: trimmedNickname});
    const existing = await kv.get(["players", trimmedNickname]);

    if (existing.value) {
      logger.info("Duplicate nickname found", {
        nickname: trimmedNickname,
        existingData: existing.value,
      });
      return {
        duplicated: true,
        member: null,
      };
    }

    const member_no =
      Math.floor(
        Math.random() * (MEMBER_NO_RANGE.MAX - MEMBER_NO_RANGE.MIN + 1)
      ) + MEMBER_NO_RANGE.MIN;

    logger.info("Nickname available, generated member_no", {
      nickname: trimmedNickname,
      member_no,
    });

    return {
      duplicated: false,
      member: {
        member_no,
      },
    };
  } catch (error) {
    const err = error as Error;
    logger.error("Database error in nickname duplication check", err, {
      nickname: trimmedNickname,
    });
    throw new Error("닉네임 중복 확인 중 오류가 발생했습니다.");
  }
}
