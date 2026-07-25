import type { Metadata } from "next";

import "@/app/globals.css";

import { AgentContextProvider } from "@/components/conversation/AgentContextProvider";
import { AgentMountpoint } from "@/components/conversation/AgentMountpoint";
import { toSearchFeatureFlags } from "@/lib/features/search-feature-flags";
import { resolveRuntimeConfig } from "@/lib/runtime/runtime-config";

export const metadata: Metadata = {
  title: "RoboMotion Industries Product Discovery",
  description: "A secured Coveo Commerce and Headless product discovery implementation.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const featureFlags = toSearchFeatureFlags(resolveRuntimeConfig().featureFlags);

  return (
    <html lang="en">
      <body>
        <AgentContextProvider>
          {children}
          <AgentMountpoint
            citationsEnabled={featureFlags.enableGenerativeCitations}
            enabled={featureFlags.enableConversationalAgent}
          />
        </AgentContextProvider>
      </body>
    </html>
  );
}
