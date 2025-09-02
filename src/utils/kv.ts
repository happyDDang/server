import {logger} from "./logger.ts";

let kvInstance: Deno.Kv | null = null;

export async function getKvInstance(): Promise<Deno.Kv> {
  if (kvInstance) {
    return kvInstance;
  }

  try {
    const isProduction = Deno.env.get("DENO_DEPLOYMENT_ID") !== undefined;

    if (isProduction) {
      // 원격 KV 데이터베이스 직접 연결 시도
      const databaseId = "b41eba3f-d1e9-46ab-8df7-e307727b9e28";
      const kvUrl = `https://api.deno.com/databases/${databaseId}/connect`;

      logger.info("Attempting to connect to remote KV database", {databaseId});

      // 런타임에 DENO_KV_ACCESS_TOKEN 설정 시도
      const customToken =
        Deno.env.get("KV_ACCESS_TOKEN") ||
        Deno.env.get("APP_KV_TOKEN") ||
        "ddp_ZlHHRUMfcUmykrQ5W9RtCElxlOKrE62se0xj"; // 하드코딩된 토큰

      if (customToken) {
        Deno.env.set("DENO_KV_ACCESS_TOKEN", customToken);
        logger.info("DENO_KV_ACCESS_TOKEN set programmatically");
      }

      try {
        kvInstance = await Deno.openKv(kvUrl);
        logger.info("Successfully connected to remote KV database");
      } catch (kvError) {
        logger.error(
          "Failed to connect to remote KV database",
          kvError as Error
        );
        throw kvError;
      }
    } else {
      logger.info("Using local KV database (development mode)");
      kvInstance = await Deno.openKv();
    }

    logger.info("KV database connection established successfully", {
      isProduction,
      kvType: isProduction ? "Deno Deploy KV" : "Local KV",
    });

    // KV 연결 테스트 및 정보 확인
    try {
      await kvInstance.set(["test"], "connection_ok");
      const testResult = await kvInstance.get(["test"]);
      await kvInstance.delete(["test"]);

      // KV 인스턴스 정보 확인
      const kvInfo = {
        testValue: testResult.value,
        deploymentId: Deno.env.get("DENO_DEPLOYMENT_ID"),
        region: Deno.env.get("DENO_REGION"),
      };

      logger.info("KV connection test successful", kvInfo);

      // 기존 데이터 개수 확인
      let existingCount = 0;
      const iter = kvInstance.list({prefix: []}, {limit: 100});
      for await (const _entry of iter) {
        existingCount++;
      }
      logger.info("Existing KV data count", {count: existingCount});
    } catch (testError) {
      logger.error("KV connection test failed", testError as Error);
    }

    return kvInstance;
  } catch (error) {
    const err = error as Error;
    logger.error("Failed to connect to KV database", err, {
      hasKvUrl: !!Deno.env.get("DENO_KV_URL"),
      hasAccessToken: !!Deno.env.get("KV_ACCESS_TOKEN"),
    });
    throw new Error("데이터베이스 연결에 실패했습니다.");
  }
}

export function closeKv(): void {
  if (kvInstance) {
    kvInstance.close();
    kvInstance = null;
    logger.info("KV database connection closed");
  }
}
