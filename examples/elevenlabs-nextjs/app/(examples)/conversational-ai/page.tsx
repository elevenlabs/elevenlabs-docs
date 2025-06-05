'use client';

import { Separator } from '@/components/ui/separator';

import AgentSelector from './components/agent-selector';
import ConversationUI from './components/conversation-ui';
import { useConversationalAI } from './components/conversational-ai-provider';
import EmptyState from './components/empty-state';

export default function Page() {
  const { agents, error } = useConversationalAI();

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="mb-4 text-2xl font-bold">Conversational AI</h1>
        <p className="text-muted-foreground">Error loading agents: {error || 'Unknown error'}</p>
      </div>
    );
  }

  if (agents.length === 0) {
    return <EmptyState />;
  }

  const defaultAgent = agents[0].agentId;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Conversational AI</h1>
          <p className="text-muted-foreground">Build life-like conversational agents</p>
        </div>
        <AgentSelector defaultAgent={defaultAgent} />
      </div>

      <Separator className="mb-6" />

      <ConversationUI />
    </div>
  );
}
