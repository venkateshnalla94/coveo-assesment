import {
  GenerativeConfigurationError,
  GenerativeProviderError,
  GenerativeTimeoutError,
} from "@/features/generative/providers/generative-errors";

export type ApplicationErrorCode =
  | "NETWORK"
  | "CONFIGURATION"
  | "AUTHENTICATION"
  | "PROVIDER"
  | "TIMEOUT"
  | "VALIDATION"
  | "UNKNOWN";

export interface ApplicationError {
  code: ApplicationErrorCode;
  message: string;
  userMessage: string;
  recoverable: boolean;
  cause?: unknown;
  metadata?: Record<string, unknown>;
}

export class ConfigurationError extends Error {
  constructor(
    message: string,
    readonly metadata?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ConfigurationError";
  }
}

export function toApplicationError(error: unknown): ApplicationError {
  if (isApplicationError(error)) {
    return sanitizeApplicationError(error);
  }

  if (error instanceof ConfigurationError || error instanceof GenerativeConfigurationError) {
    return {
      cause: error,
      code: "CONFIGURATION",
      message: error.message,
      metadata: sanitizeMetadata(error instanceof ConfigurationError ? error.metadata : undefined),
      recoverable: true,
      userMessage: "This feature is not configured for the current environment.",
    };
  }

  if (error instanceof GenerativeTimeoutError || isTimeoutError(error)) {
    return {
      cause: error,
      code: "TIMEOUT",
      message: getErrorMessage(error, "The request timed out."),
      recoverable: true,
      userMessage: "The request took too long. Try again.",
    };
  }

  if (error instanceof GenerativeProviderError) {
    return {
      cause: error,
      code: "PROVIDER",
      message: error.message,
      recoverable: true,
      userMessage: "The provider could not complete the request.",
    };
  }

  if (isNetworkError(error)) {
    return {
      cause: error,
      code: "NETWORK",
      message: getErrorMessage(error, "A network request failed."),
      recoverable: true,
      userMessage: "Network access failed. Check connectivity and try again.",
    };
  }

  if (error instanceof Error) {
    return {
      cause: error,
      code: "UNKNOWN",
      message: error.message,
      recoverable: true,
      userMessage: "Something went wrong. Try again.",
    };
  }

  return {
    cause: error,
    code: "UNKNOWN",
    message: "Unknown error.",
    recoverable: true,
    userMessage: "Something went wrong. Try again.",
  };
}

export function sanitizeMetadata(metadata: Record<string, unknown> | undefined) {
  if (!metadata) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([key]) => !/token|authorization|api[-_]?key|secret|password/i.test(key))
      .map(([key, value]) => [key, sanitizeValue(value)]),
  );
}

function sanitizeApplicationError(error: ApplicationError): ApplicationError {
  return {
    ...error,
    metadata: sanitizeMetadata(error.metadata),
  };
}

function isApplicationError(error: unknown): error is ApplicationError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error &&
    "userMessage" in error &&
    "recoverable" in error
  );
}

function isNetworkError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.name === "NetworkError" || /fetch|network/i.test(error.message);
}

function isTimeoutError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.name === "TimeoutError" || /timeout|timed out/i.test(error.message);
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string" && /bearer\s+|token|authorization|api[-_]?key/i.test(value)) {
    return "[redacted]";
  }

  return value;
}
