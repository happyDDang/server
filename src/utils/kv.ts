import { logger } from "./logger.ts";

let kvInstance: Deno.Kv | null = null;

export async function getKvInstance(): Promise<Deno.Kv> {
  if (kvInstance) {
    return kvInstance;
  }

  try {
    const isProduction = Deno.env.get("DENO_DEPLOYMENT_ID") !== undefined;
    
    if (isProduction) {
      // 프로젝트별 KV URL 사용 (대시보드에 보이는 데이터와 동일)
      const projectKvUrl = "https://api.deno.com/databases/b41eba3f-d1e9-46ab-8df7-e307727b9e28/connect";
      logger.info("Using Deno Deploy project KV (production)", { url: projectKvUrl });
      
      // 액세스 토큰 필요한지 확인
      const accessToken = Deno.env.get("DENO_KV_ACCESS_TOKEN");
      if (!accessToken) {
        logger.warn("DENO_KV_ACCESS_TOKEN not found, trying without token");
      }
      
      kvInstance = await Deno.openKv(projectKvUrl);
    } else {
      logger.info("Using local KV database (development mode)");
      kvInstance = await Deno.openKv();
    }

    logger.info("KV database connection established successfully", {
      isProduction,
      kvType: isProduction ? "Deno Deploy KV" : "Local KV"
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
      logger.info("Existing KV data count", { count: existingCount });
      
    } catch (testError) {
      logger.error("KV connection test failed", testError as Error);
    }
    
    return kvInstance;
  } catch (error) {
    const err = error as Error;
    logger.error("Failed to connect to KV database", err, {
      hasKvUrl: !!Deno.env.get("DENO_KV_URL")
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