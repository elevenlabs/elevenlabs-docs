'use client';

import * as ElevenLabs from 'elevenlabs/api';
import { createContext, ReactNode, useContext } from 'react';

interface ConversationalAIContextType {
  agents: ElevenLabs.AgentSummaryResponseModel[];
  error: string | null;
}

const ConversationalAIContext = createContext<ConversationalAIContextType | null>(null);

export function useConversationalAI() {
  const context = useContext(ConversationalAIContext);
  if (!context) {
    throw new Error('useConversationalAI must be used within a ConversationalAIProvider');
  }
  return context;
}

interface ConversationalAIProviderProps {
  children: ReactNode;
  agents: ElevenLabs.AgentSummaryResponseModel[];
  error: string | null;
}

export default function ConversationalAIProvider({
  children,
  agents,
  error,
}: ConversationalAIProviderProps) {
  return (
    <ConversationalAIContext.Provider value={{ agents, error }}>
      {children}
    </ConversationalAIContext.Provider>
  );
}
