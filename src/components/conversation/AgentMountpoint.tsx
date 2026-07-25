"use client";

import { useMemo } from "react";

import { ConversationalAgent } from "@/components/conversation/ConversationalAgent";
import { CoveoConversationProvider } from "@/features/conversation/providers/coveo-conversation-provider";

export function AgentMountpoint({ citationsEnabled, enabled }: { citationsEnabled: boolean; enabled: boolean }) {
  const provider = useMemo(() => new CoveoConversationProvider(), []);

  return <ConversationalAgent citationsEnabled={citationsEnabled} enabled={enabled} provider={provider} />;
}
