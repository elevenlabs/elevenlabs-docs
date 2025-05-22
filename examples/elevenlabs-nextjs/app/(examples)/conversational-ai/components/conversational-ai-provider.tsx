'use client';

import { AgentSummaryResponseModel } from '@elevenlabs/elevenlabs-js/api';
import { createContext, ReactNode, useContext } from 'react';

interface ConversationalAIContextType {
  agents: AgentSummaryResponseModel[];
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
  agents: AgentSummaryResponseModel[];
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
