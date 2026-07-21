export class GenerativeConfigurationError extends Error {
  constructor(message = "Generative answers are not configured for this environment.") {
    super(message);
    this.name = "GenerativeConfigurationError";
  }
}

export class GenerativeProviderError extends Error {
  constructor(message = "The generative answer provider failed.") {
    super(message);
    this.name = "GenerativeProviderError";
  }
}

export class GenerativeTimeoutError extends Error {
  constructor(message = "The generative answer provider timed out.") {
    super(message);
    this.name = "GenerativeTimeoutError";
  }
}
