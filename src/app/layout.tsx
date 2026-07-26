import type { Metadata } from "next";
import { Suspense } from "react";

import "@/app/globals.css";

import { AgentContextProvider } from "@/components/conversation/AgentContextProvider";
import { AgentMountpoint } from "@/components/conversation/AgentMountpoint";
import { AppChrome } from "@/components/layout/AppChrome";
import { Footer } from "@/components/layout/Footer";
import { HeaderSearchProvider } from "@/components/layout/header-search-context";
import { resolveHeadlessCommerceAuthConfig } from "@/features/commerce/headless/commerce-auth-resolver";
import { toSearchFeatureFlags } from "@/lib/features/search-feature-flags";
import { resolveRuntimeConfig } from "@/lib/runtime/runtime-config";

export const metadata: Metadata = {
  title: "RoboMotion Industries Product Discovery",
  description: "A secured Coveo Commerce and Headless product discovery implementation.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const runtimeConfig = resolveRuntimeConfig();
  const featureFlags = toSearchFeatureFlags(runtimeConfig.featureFlags);
  const commerceAuthConfig = resolveHeadlessCommerceAuthConfig(runtimeConfig);

  return (
    <html lang="en">
      <body>
        <AgentContextProvider>
          <div className="search-app">
            <HeaderSearchProvider>
              <Suspense fallback={null}>
                <AppChrome authConfig={commerceAuthConfig} />
              </Suspense>
              {children}
            </HeaderSearchProvider>
            <Footer />
          </div>
          <AgentMountpoint
            citationsEnabled={featureFlags.enableGenerativeCitations}
            enabled={featureFlags.enableConversationalAgent}
          />
        </AgentContextProvider>
      </body>
    </html>
  );
}
