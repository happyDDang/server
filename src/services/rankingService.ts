import type {Player} from "../models/index.ts";
import {DEFAULT_TOP_RANK_SIZE} from "../config/constants.ts";
import {logger} from "../utils/logger.ts";

const kv = await Deno.openKv();

export async function registerPlayerRanking(
  member_no: number,
  nickname: string,
  score: number
) {
  const trimmedNickname = nickname?.trim();

  if (!member_no || !trimmedNickname || score === undefined || score === null) {
    logger.warn("Invalid parameters for player ranking registration", {
      member_no,
      nickname: trimmedNickname,
      score,
    });
    throw new Error("member_no, 닉네임, 점수를 모두 입력해주세요.");
  }

  try {
    logger.logDatabaseOperation("get", "players", {nickname: trimmedNickname});
    const existing = await kv.get(["players", trimmedNickname]);
    if (existing.value) {
      logger.warn("Attempt to register duplicate nickname", {
        nickname: trimmedNickname,
        member_no,
        score,
        existingData: existing.value,
      });
      throw new Error("이미 등록된 닉네임입니다.");
    }

    const player: Player = {
      member_no: parseInt(member_no.toString()),
      nickname: trimmedNickname,
      score: parseInt(score.toString()),
      timestamp: Date.now(),
    };

    logger.logDatabaseOperation("set", "players", {
      nickname: player.nickname,
      member_no: player.member_no,
      score: player.score,
    });

    await kv.set(["players", player.nickname], player);
    await kv.set(["members", player.member_no], player);

    const sortKey = [-player.score, player.timestamp];
    await kv.set(["rankings", ...sortKey], player);

    logger.logBusinessEvent("player_ranking_registered", {
      member_no: player.member_no,
      nickname: player.nickname,
      score: player.score,
    });

    return player;
  } catch (error) {
    const err = error as Error;
    logger.error("Database error in player ranking registration", err, {
      member_no,
      nickname: trimmedNickname,
      score,
    });
    throw error;
  }
}

export async function fetchRankings(memberNo?: string, topRankSize?: number) {
  const rankSize = topRankSize || DEFAULT_TOP_RANK_SIZE;

  try {
    logger.logDatabaseOperation("list", "rankings", { 
      limit: rankSize,
      memberNo: memberNo || "all" 
    });

    const topPlayers: Player[] = [];
    const iter = kv.list({prefix: ["rankings"]}, {limit: rankSize});

    for await (const entry of iter) {
      topPlayers.push(entry.value as Player);
    }

    const topRank = topPlayers.map((player) => ({
      nickname: player.nickname,
      score: player.score,
    }));

    logger.debug("Top rankings fetched", {
      count: topRank.length,
      requestedSize: rankSize,
    });

    let myRank = null;
    if (memberNo) {
      logger.logDatabaseOperation("get", "members", { memberNo });
      const myInfo = await kv.get(["members", parseInt(memberNo)]);
      
      if (myInfo.value) {
        const myPlayer = myInfo.value as Player;

        logger.debug("Calculating user rank", {
          memberNo,
          nickname: myPlayer.nickname,
          score: myPlayer.score,
        });

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

        logger.info("User rank calculated", {
          memberNo,
          nickname: myPlayer.nickname,
          score: myPlayer.score,
          rank: rank,
        });
      } else {
        logger.warn("Member not found for ranking lookup", { memberNo });
      }
    }

    const result = {
      top_rank: topRank,
      my_rank: myRank,
    };

    logger.info("Rankings fetch completed", {
      topRankCount: topRank.length,
      hasUserRank: !!myRank,
      memberNo: memberNo || "all",
    });

    return result;
  } catch (error) {
    const err = error as Error;
    logger.error("Database error in fetch rankings", err, {
      memberNo: memberNo || "all",
      topRankSize: rankSize,
    });
    throw new Error("랭킹 조회 중 오류가 발생했습니다.");
  }
}
