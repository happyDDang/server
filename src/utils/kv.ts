import { logger } from "./logger.ts";

let kvInstance: Deno.Kv | null = null;

export async function getKvInstance(): Promise<Deno.Kv> {
  if (kvInstance) {
    return kvInstance;
  }

  try {
    const isProduction = Deno.env.get("DENO_DEPLOYMENT_ID") !== undefined;
    
    if (isProduction) {
      // Deno Deploy 내장 KV 사용 (별도 URL 불필요)
      logger.info("Using Deno Deploy integrated KV (production)");
      kvInstance = await Deno.openKv();
    } else {
      logger.info("Using local KV database (development mode)");
      kvInstance = await Deno.openKv();
    }

    logger.info("KV database connection established successfully", {
      isProduction,
      kvType: isProduction ? "Deno Deploy KV" : "Local KV"
    });
    
    // KV 연결 테스트
    try {
      await kvInstance.set(["test"], "connection_ok");
      const testResult = await kvInstance.get(["test"]);
      await kvInstance.delete(["test"]);
      logger.info("KV connection test successful", { testValue: testResult.value });
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