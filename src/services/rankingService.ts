import type {Player} from "../models/index.ts";
import {DEFAULT_TOP_RANK_SIZE} from "../config/constants.ts";

const kv = await Deno.openKv();

export async function registerPlayerRanking(
  member_no: number,
  nickname: string,
  score: number
) {
  if (!member_no || !nickname || score === undefined || score === null) {
    throw new Error("member_no, 닉네임, 점수를 모두 입력해주세요.");
  }

  const existing = await kv.get(["players", nickname.trim()]);
  if (existing.value) {
    throw new Error("이미 등록된 닉네임입니다.");
  }

  const player: Player = {
    member_no: parseInt(member_no.toString()),
    nickname: nickname.trim(),
    score: parseInt(score.toString()),
    timestamp: Date.now(),
  };

  await kv.set(["players", player.nickname], player);
  await kv.set(["members", player.member_no], player);

  const sortKey = [-player.score, player.timestamp];
  await kv.set(["rankings", ...sortKey], player);

  return player;
}

export async function fetchRankings(memberNo?: string, topRankSize?: number) {
  const rankSize = topRankSize || DEFAULT_TOP_RANK_SIZE;

  const topPlayers: Player[] = [];
  const iter = kv.list({prefix: ["rankings"]}, {limit: rankSize});

  for await (const entry of iter) {
    topPlayers.push(entry.value as Player);
  }

  const topRank = topPlayers.map((player) => ({
    nickname: player.nickname,
    score: player.score,
  }));

  let myRank = null;
  if (memberNo) {
    const myInfo = await kv.get(["members", parseInt(memberNo)]);
    if (myInfo.value) {
      const myPlayer = myInfo.value as Player;

      let rank = 1;
      const rankIter = kv.list({prefix: ["rankings"]});

      for await (const entry of rankIter) {
        const otherPlayer = entry.value as Player;
        if (otherPlayer.score > myPlayer.score) {
          rank++;
        } else if (
          otherPlayer.score === myPlayer.score &&
          otherPlayer.timestamp < myPlayer.timestamp
        ) {
          rank++;
        } else if (otherPlayer.member_no === myPlayer.member_no) {
          break;
        }
      }

      myRank = {
        rank: rank,
        nickname: myPlayer.nickname,
        score: myPlayer.score,
      };
    }
  }

  return {
    top_rank: topRank,
    my_rank: myRank,
  };
}
