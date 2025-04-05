import { Metadata } from "next";
import { getAgents } from "@/app/actions/manage-agents";
import ConversationalAIProvider from "@/app/(examples)/conversational-ai/components/conversational-ai-provider";

export const metadata: Metadata = {
  title: "Conversational AI",
  description: "Build life-like conversational agents with ElevenLabs",
};

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const agentsResult = await getAgents();

  const sortedAgents = agentsResult.ok
    ? [...agentsResult.value.agents].sort(
        (a, b) => b.created_at_unix_secs - a.created_at_unix_secs
      )
    : [];

  return (
    <ConversationalAIProvider
      agents={sortedAgents}
      error={!agentsResult.ok ? agentsResult.error : null}
    >
      {children}
    </ConversationalAIProvider>
  );
}
