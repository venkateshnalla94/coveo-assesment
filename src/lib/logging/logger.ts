import { sanitizeMetadata, toApplicationError } from "@/lib/errors/application-error";

export interface LogEntry {
  level: "debug" | "info" | "warn" | "error";
  event: string;
  timestamp: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

export interface Logger {
  debug(event: string, metadata?: Record<string, unknown>): void;
  info(event: string, metadata?: Record<string, unknown>): void;
  warn(event: string, metadata?: Record<string, unknown>): void;
  error(event: string, error?: unknown, metadata?: Record<string, unknown>): void;
}

export class ConsoleLogger implements Logger {
  constructor(private readonly minimumLevel: LogEntry["level"] = "info") {}

  debug(event: string, metadata?: Record<string, unknown>): void {
    this.write("debug", event, metadata);
  }

  info(event: string, metadata?: Record<string, unknown>): void {
    this.write("info", event, metadata);
  }

  warn(event: string, metadata?: Record<string, unknown>): void {
    this.write("warn", event, metadata);
  }

  error(event: string, error?: unknown, metadata?: Record<string, unknown>): void {
    const applicationError = error === undefined ? undefined : toApplicationError(error);
    this.write("error", event, {
      ...metadata,
      ...(applicationError
        ? {
            errorCode: applicationError.code,
            errorMessage: applicationError.message,
            recoverable: applicationError.recoverable,
          }
        : {}),
    });
  }

  private write(level: LogEntry["level"], event: string, metadata?: Record<string, unknown>) {
    if (levelRank[level] < levelRank[this.minimumLevel]) {
      return;
    }

    const entry: LogEntry = {
      event,
      level,
      metadata: sanitizeMetadata(metadata),
      timestamp: new Date().toISOString(),
    };

    const method = level === "error" ? console.error : level === "warn" ? console.warn : console.info;
    method("[app]", entry);
  }
}

export class NoopLogger implements Logger {
  debug(..._args: Parameters<Logger["debug"]>): void {
    void _args;
  }
  info(..._args: Parameters<Logger["info"]>): void {
    void _args;
  }
  warn(..._args: Parameters<Logger["warn"]>): void {
    void _args;
  }
  error(..._args: Parameters<Logger["error"]>): void {
    void _args;
  }
}

export function createCorrelationId(prefix = "action") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const levelRank: Record<LogEntry["level"], number> = {
  debug: 10,
  error: 40,
  info: 20,
  warn: 30,
};
