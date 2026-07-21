import type { GenerativeProvider } from "@/features/generative/providers/generative-provider";
import type { GenerativeAnswer } from "@/features/generative/models/generative-models";
import { GenerativeConfigurationError } from "@/features/generative/providers/generative-errors";

export class CoveoGenerativeProvider implements GenerativeProvider {
  async generate(): Promise<GenerativeAnswer | null> {
    throw new GenerativeConfigurationError(
      "Live Coveo generative answers require a supported endpoint and server-side integration.",
    );
  }
}
