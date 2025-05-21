import { Metadata } from 'next';

import ConversationalAIProvider from '@/app/(examples)/conversational-ai/components/conversational-ai-provider';
import { getAgents } from '@/app/actions/manage-agents';

export const metadata: Metadata = {
  title: 'Conversational AI',
  description: 'Build life-like conversational agents with ElevenLabs',
};

export default async function Layout({ children }: { children: React.ReactNode }) {
  const agentsResult = await getAgents();

  const sortedAgents = agentsResult.ok
    ? [...agentsResult.value.agents].sort((a, b) => b.createdAtUnixSecs - a.createdAtUnixSecs)
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
