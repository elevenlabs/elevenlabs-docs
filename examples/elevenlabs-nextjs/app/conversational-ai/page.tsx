'use client';

import { useConversation } from '@11labs/react';
import * as ElevenLabs from 'elevenlabs/api';
import { CalendarIcon, Loader2, Mic, PhoneOff, UserCircle, Info, Terminal } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';

import { getAgent, getAgents, getAgentSignedUrl } from '@/app/actions/elevenlabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function ConversationalAIPage() {
  const [agents, setAgents] = useState<ElevenLabs.AgentSummaryResponseModel[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [agentDetails, setAgentDetails] = useState<ElevenLabs.GetAgentResponseModel | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [editablePrompt, setEditablePrompt] = useState<string>('');
  const [editableFirstMessage, setEditableFirstMessage] = useState<string>('');

  const conversation = useConversation({
    onConnect: () => console.log('Connected to agent'),
    onDisconnect: () => console.log('Disconnected from agent'),
    onMessage: (message) => console.log('Message:', message),
    onError: (error) => console.error('Error:', error),
  });

  useEffect(() => {
    setIsLoading(true);
    getAgents().then((result) => {
      if (result.ok) {
        const sortedAgents = [...result.value].sort(
          (a, b) => b.created_at_unix_secs - a.created_at_unix_secs
        );
        setAgents(sortedAgents);
        if (sortedAgents.length > 0) {
          setSelectedAgent(sortedAgents[0].agent_id);
        }
      }
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedAgent) {
      setIsLoadingDetails(true);
      getAgent(selectedAgent).then((result) => {
        if (result.ok) {
          setAgentDetails(result.value);
          setEditablePrompt(result.value.conversation_config?.agent?.prompt?.prompt || '');
          setEditableFirstMessage(result.value.conversation_config?.agent?.first_message || '');
        } else {
          console.error('Failed to load agent details:', result.error);
          setAgentDetails(null);
        }
        setIsLoadingDetails(false);
      });
    }
  }, [selectedAgent]);

  const startConversation = useCallback(async () => {
    if (!selectedAgent) return;

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const signedUrlResult = await getAgentSignedUrl(selectedAgent);

      if (!signedUrlResult.ok) {
        console.error('Failed to get signed URL:', signedUrlResult.error);
        return;
      }

      await conversation.startSession({
        signedUrl: signedUrlResult.value,
        overrides: {
          agent: {
            prompt: {
              prompt: editablePrompt,
            },
            firstMessage: editableFirstMessage,
          },
        },
      });
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  }, [conversation, selectedAgent, editablePrompt, editableFirstMessage]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const formatDate = (unixTimestamp: number) => {
    const date = new Date(unixTimestamp * 1000);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getSelectedAgentData = () => {
    return agents.find((a) => a.agent_id === selectedAgent);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="mb-4 text-2xl font-bold">Conversational AI</h1>
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="mb-4 text-2xl font-bold">Conversational AI</h1>
        <div className="flex h-80 flex-col items-center justify-center">
          <Image
            src="/empty-folder.png"
            alt="Sound effect placeholder"
            width={160}
            height={160}
            className="select-none"
            draggable={false}
          />
          <h3 className="mb-2 text-xl font-medium">No agents found</h3>
          <p className="text-muted-foreground text-center">
            Create an agent in the ElevenLabs dashboard
          </p>
          <Button
            onClick={() => window.open('https://elevenlabs.io/app/conversational-ai', '_blank')}
            className="mt-6"
          >
            Create Agent
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Conversational AI</h1>
          <p className="text-muted-foreground">Build life-like conversational agents</p>
        </div>{' '}
        <Select
          value={selectedAgent || undefined}
          onValueChange={(value) => setSelectedAgent(value)}
        >
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
              <SelectItem key={agent.agent_id} value={agent.agent_id} className="py-2 pl-2 pr-6">
                <div className="flex flex-col">
                  <div className="font-medium">{agent.name}</div>
                  <div className="text-muted-foreground mt-1 flex items-center text-xs">
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    <span>{formatDate(agent.created_at_unix_secs)}</span>
                    {agent.access_info?.is_creator && (
                      <span className="ml-2 flex items-center">
                        <UserCircle className="mr-1 h-3 w-3" />
                        <span>Creator</span>
                      </span>
                    )}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator className="mb-6" />

      {isLoadingDetails ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : !agentDetails ? (
        <p>Failed to load agent details</p>
      ) : (
        <>
          <div className="mb-6">
            <h3 className="text-xl font-bold">{agentDetails.name}</h3>
            {agentDetails.agent_id && (
              <p className="text-muted-foreground">{agentDetails.agent_id}</p>
            )}
          </div>
          <h2 className="mb-2 text-xl font-medium">Overrides</h2>
          <div className="mb-6">
            <div className="mb-2 flex items-center gap-2">
              <h4 className="font-medium">First Message</h4>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="text-muted-foreground h-4 w-4 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-80">
                    <p>The first message the agent will say when the conversation starts.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              value={editableFirstMessage}
              onChange={(e) => setEditableFirstMessage(e.target.value)}
              className="max-h-40 min-h-20 overflow-y-auto font-mono text-sm"
              placeholder="Enter first message..."
            />
          </div>

          <div className="mb-6">
            <div className="mb-2 flex items-center gap-2">
              <h4 className="font-medium">Agent Prompt</h4>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="text-muted-foreground h-4 w-4 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-80">
                    <p>
                      If the conversation fails, ensure prompt overrides are enabled for this agent
                      in the ElevenLabs security settings dashboard.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              value={editablePrompt}
              onChange={(e) => setEditablePrompt(e.target.value)}
              className="max-h-80 min-h-32 overflow-y-auto font-mono text-sm"
              placeholder="Enter agent prompt..."
            />
          </div>

          <div className="flex flex-col items-center gap-4">
            <Button
              onClick={conversation.status === 'connected' ? stopConversation : startConversation}
              disabled={conversation.status === 'connecting'}
              variant={conversation.status === 'connected' ? 'secondary' : 'default'}
              className="cursor-pointer"
            >
              {conversation.status === 'connecting' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : conversation.status === 'connected' ? (
                <>
                  <PhoneOff className="mr-2 h-4 w-4" />
                  End Call
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-4 w-4" />
                  Start Call
                </>
              )}
            </Button>

            <div className="mt-2 flex items-center gap-2">
              <p className="text-sm font-medium">
                Status: <span className="capitalize">{conversation.status}</span>
              </p>
              {conversation.status === 'connected' && (
                <p className="text-muted-foreground text-sm">
                  {conversation.isSpeaking ? 'Agent is speaking' : 'Agent is listening'}
                </p>
              )}
            </div>
          </div>

          <Alert variant="default" className="mt-3">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Troubleshooting</AlertTitle>
            <AlertDescription>
              If the conversation ends unexpectedly:
              <ul className="mt-1 list-disc pl-5">
                <li>
                  Make sure System Prompt & First Message overrides are enabled for this agent in
                  the agent security tab
                </li>
                <li>Check your microphone permissions are granted</li>
                <li>Try refreshing the page and connecting again</li>
              </ul>
            </AlertDescription>
          </Alert>
        </>
      )}
    </div>
  );
}
