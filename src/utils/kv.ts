import { logger } from "./logger.ts";

let kvInstance: Deno.Kv | null = null;

export async function getKvInstance(): Promise<Deno.Kv> {
  if (kvInstance) {
    return kvInstance;
  }

  try {
    const isProduction = Deno.env.get("DENO_DEPLOYMENT_ID") !== undefined;
    
    if (isProduction) {
      const remoteKvUrl = "https://api.deno.com/databases/b41eba3f-d1e9-46ab-8df7-e307727b9e28/connect";
      logger.info("Connecting to remote KV database (production)");
      kvInstance = await Deno.openKv(remoteKvUrl);
    } else {
      logger.info("Using local KV database (development mode)");
      kvInstance = await Deno.openKv();
    }

    logger.info("KV database connection established successfully");
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