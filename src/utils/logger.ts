export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogContext {
  userId?: string;
  requestId?: string;
  method?: string;
  path?: string;
  userAgent?: string;
  ip?: string;
  duration?: number;
  statusCode?: number;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private logLevel: LogLevel;
  private serviceName: string;

  constructor(serviceName: string = "happy-ddang-api", logLevel: LogLevel = LogLevel.INFO) {
    this.serviceName = serviceName;
    this.logLevel = this.getLogLevelFromEnv() ?? logLevel;
  }

  private getLogLevelFromEnv(): LogLevel | null {
    const envLevel = Deno.env.get("LOG_LEVEL")?.toUpperCase();
    switch (envLevel) {
      case "DEBUG": return LogLevel.DEBUG;
      case "INFO": return LogLevel.INFO;
      case "WARN": return LogLevel.WARN;
      case "ERROR": return LogLevel.ERROR;
      default: return null;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private formatLogEntry(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message,
      context: {
        service: this.serviceName,
        ...context,
      },
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return entry;
  }

  private output(entry: LogEntry): void {
    const logString = JSON.stringify(entry);
    
    switch (entry.level) {
      case "ERROR":
        console.error(logString);
        break;
      case "WARN":
        console.warn(logString);
        break;
      case "DEBUG":
        console.debug(logString);
        break;
      default:
        console.log(logString);
        break;
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.output(this.formatLogEntry(LogLevel.DEBUG, message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.output(this.formatLogEntry(LogLevel.INFO, message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.output(this.formatLogEntry(LogLevel.WARN, message, context));
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.output(this.formatLogEntry(LogLevel.ERROR, message, context, error));
    }
  }

  // 요청 시작 로깅
  logRequestStart(req: Request, requestId: string): void {
    const url = new URL(req.url);
    this.info("Request started", {
      requestId,
      method: req.method,
      path: url.pathname,
      userAgent: req.headers.get("User-Agent") || undefined,
      ip: req.headers.get("CF-Connecting-IP") || req.headers.get("X-Forwarded-For") || undefined,
    });
  }

  // 요청 완료 로깅
  logRequestComplete(req: Request, requestId: string, statusCode: number, duration: number): void {
    const url = new URL(req.url);
    const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    const message = `Request completed - ${statusCode}`;
    
    if (level === LogLevel.WARN && this.shouldLog(level)) {
      this.warn(message, {
        requestId,
        method: req.method,
        path: url.pathname,
        statusCode,
        duration,
      });
    } else {
      this.info(message, {
        requestId,
        method: req.method,
        path: url.pathname,
        statusCode,
        duration,
      });
    }
  }

  // 데이터베이스 작업 로깅
  logDatabaseOperation(operation: string, table: string, context?: LogContext): void {
    this.debug(`Database operation: ${operation} on ${table}`, context);
  }

  // 비즈니스 로직 로깅
  logBusinessEvent(event: string, context?: LogContext): void {
    this.info(`Business event: ${event}`, context);
  }
}

// 싱글톤 인스턴스
export const logger = new Logger();

// 요청 ID 생성 유틸리티
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}