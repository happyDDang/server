import {logger, generateRequestId, LogContext} from "./logger.ts";
import {errorResponse} from "./response.ts";

export interface RequestContext {
  requestId: string;
  startTime: number;
}

// 요청 컨텍스트를 저장하기 위한 WeakMap
const requestContexts = new WeakMap<Request, RequestContext>();

export function withLogging<T extends unknown[]>(
  handler: (req: Request, ...args: T) => Promise<Response>
) {
  return async (req: Request, ...args: T): Promise<Response> => {
    const requestId = generateRequestId();
    const startTime = Date.now();

    // 요청 컨텍스트 저장
    requestContexts.set(req, {requestId, startTime});

    // 요청 시작 로깅
    logger.logRequestStart(req, requestId);

    try {
      const response = await handler(req, ...args);
      const duration = Date.now() - startTime;

      // 성공적인 요청 완료 로깅
      logger.logRequestComplete(req, requestId, response.status, duration);

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      const err = error as Error;

      // 에러 로깅
      logger.error("Request failed with unhandled error", err, {
        requestId,
        method: req.method,
        path: new URL(req.url).pathname,
        duration,
      });

      // 에러 응답 로깅
      logger.logRequestComplete(req, requestId, 500, duration);

      return errorResponse("서버 내부 오류가 발생했습니다.", 500, req);
    }
  };
}

export function getRequestContext(req: Request): RequestContext | undefined {
  return requestContexts.get(req);
}

export function createLogContext(
  req: Request,
  additionalContext?: Record<string, unknown>
): LogContext {
  const context = getRequestContext(req);
  const url = new URL(req.url);

  return {
    requestId: context?.requestId,
    method: req.method,
    path: url.pathname,
    userAgent: req.headers.get("User-Agent") || undefined,
    ip:
      req.headers.get("CF-Connecting-IP") ||
      req.headers.get("X-Forwarded-For") ||
      undefined,
    ...additionalContext,
  };
}

// API 핸들러를 위한 래퍼
export function withApiLogging<T extends unknown[]>(
  handlerName: string,
  handler: (req: Request, ...args: T) => Promise<Response>
) {
  return async (req: Request, ...args: T): Promise<Response> => {
    const logContext = createLogContext(req, {handler: handlerName});

    try {
      logger.info(`${handlerName} started`, logContext);

      const response = await handler(req, ...args);

      logger.info(`${handlerName} completed`, {
        ...logContext,
        statusCode: response.status,
      });

      return response;
    } catch (error) {
      const err = error as Error;

      logger.error(`${handlerName} failed`, err, logContext);

      // 알려진 비즈니스 에러인지 확인
      if (err.message === "이미 등록된 닉네임입니다.") {
        return errorResponse(err.message, 409, req);
      }

      // 입력 검증 에러
      if (
        err.message.includes("validation") ||
        err.message.includes("required")
      ) {
        return errorResponse(err.message, 400, req);
      }

      // 알 수 없는 에러는 500으로 처리
      return errorResponse("서버 내부 오류가 발생했습니다.", 500, req);
    }
  };
}
