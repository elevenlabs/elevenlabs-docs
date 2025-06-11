'use client';

import { CalendarIcon } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useConversationalAI } from './conversational-ai-provider';

interface AgentSelectorProps {
  defaultAgent: string;
}

export default function AgentSelector({ defaultAgent }: AgentSelectorProps) {
  const { agents } = useConversationalAI();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedAgent, setSelectedAgent] = useState<string | null>(
    searchParams.get('agent_id') || defaultAgent || null
  );

  useEffect(() => {
    if (selectedAgent) {
      const params = new URLSearchParams(searchParams);
      params.set('agent_id', selectedAgent);

      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [selectedAgent, pathname, router, searchParams]);

  const handleAgentChange = (value: string) => {
    setSelectedAgent(value);
  };

  const formatDate = (unixTimestamp: number) => {
    const date = new Date(unixTimestamp * 1000);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getSelectedAgentData = () => {
    return agents.find((a) => a.agentId === selectedAgent);
  };

  return (
    <Select value={selectedAgent || undefined} onValueChange={handleAgentChange}>
      <SelectTrigger className="w-64">
        {selectedAgent ? (
          <div className="flex flex-col items-start overflow-hidden">
            <div className="w-full truncate font-medium">{getSelectedAgentData()?.name}</div>
          </div>
        ) : (
          <SelectValue placeholder="Select an agent" />
        )}
      </SelectTrigger>
      <SelectContent className="max-h-80">
        {agents.map((agent) => (
          <SelectItem key={agent.agentId} value={agent.agentId} className="py-2 pl-2 pr-6">
            <div className="flex flex-col">
              <div className="font-medium">{agent.name}</div>
              <div className="text-muted-foreground mt-1 flex items-center text-xs">
                <CalendarIcon className="mr-1 h-3 w-3" />
                <span>{formatDate(agent.createdAtUnixSecs)}</span>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
