import {MEMBER_NO_RANGE} from "../config/constants.ts";

const kv = await Deno.openKv();

export async function checkNicknameDuplicate(nickname: string) {
  if (!nickname || nickname.trim() === "") {
    throw new Error("닉네임을 입력해주세요.");
  }

  const existing = await kv.get(["players", nickname.trim()]);

  if (existing.value) {
    return {
      duplicated: true,
      member: null,
    };
  }

  const member_no =
    Math.floor(
      Math.random() * (MEMBER_NO_RANGE.MAX - MEMBER_NO_RANGE.MIN + 1)
    ) + MEMBER_NO_RANGE.MIN;

  return {
    duplicated: false,
    member: {
      member_no,
    },
  };
}
