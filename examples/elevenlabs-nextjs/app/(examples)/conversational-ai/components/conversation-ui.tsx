'use client';

import type { GetAgentResponseModel } from '@elevenlabs/elevenlabs-js/api';
import { useConversation } from '@elevenlabs/react';
import { AlertCircle, Info, Loader2, Mic, PhoneOff, Terminal } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useConversationalAI } from '@/app/(examples)/conversational-ai/components/conversational-ai-provider';
import { getAgent, getConversationToken } from '@/app/actions/manage-agents';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function ConversationUI() {
  const { agents } = useConversationalAI();
  const searchParams = useSearchParams();
  const agentIdFromUrl = searchParams.get('agent_id');

  const [selectedAgent, setSelectedAgent] = useState<string | null>(
    agentIdFromUrl || (agents.length > 0 ? agents[0].agentId : null)
  );

  const [agentDetails, setAgentDetails] = useState<GetAgentResponseModel | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editablePrompt, setEditablePrompt] = useState<string>('');
  const [editableFirstMessage, setEditableFirstMessage] = useState<string>('');

  const conversation = useConversation({
    onConnect: () => toast.info('Connected to agent'),
    onDisconnect: () => toast.info('Disconnected from agent'),
    onMessage: (message) => toast.info(`Message: ${message.message}`),
    onError: (error) => toast.error(`Error: ${error}`),
  });

  useEffect(() => {
    if (agentIdFromUrl) {
      setSelectedAgent(agentIdFromUrl);
    }
  }, [agentIdFromUrl]);

  useEffect(() => {
    let isMounted = true;

    if (selectedAgent) {
      setIsLoadingDetails(true);
      setLoadError(null);

      getAgent(selectedAgent)
        .then((result) => {
          if (!isMounted) return;

          if (result.ok) {
            setAgentDetails(result.value);
            setEditablePrompt(result.value.conversationConfig?.agent?.prompt?.prompt || '');
            setEditableFirstMessage(result.value.conversationConfig?.agent?.firstMessage || '');
            setLoadError(null);
          } else {
            console.error('Failed to load agent details:', result.error);
            setLoadError(result.error || 'Failed to load agent details');
          }
        })
        .catch((error) => {
          if (!isMounted) return;
          setLoadError('An unexpected error occurred');
          console.error('Error loading agent:', error);
        })
        .finally(() => {
          if (isMounted) {
            setIsLoadingDetails(false);
          }
        });
    }

    return () => {
      isMounted = false;
    };
  }, [selectedAgent]);

  const startConversation = useCallback(async () => {
    if (!selectedAgent) return;

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const conversationTokenResult = await getConversationToken(selectedAgent);

      if (!conversationTokenResult.ok) {
        console.error('Failed to get conversation token:', conversationTokenResult.error);
        return;
      }

      await conversation.startSession({
        connectionType: 'webrtc',
        conversationToken: conversationTokenResult.value.token,
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

  if (isLoadingDetails) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-muted-foreground">Loading agent details...</p>
      </div>
    );
  }

  if (loadError && !agentDetails) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Agent</AlertTitle>
        <AlertDescription>{loadError}</AlertDescription>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => {
            setIsLoadingDetails(true);
            setLoadError(null);
            getAgent(selectedAgent as string).then((result) => {
              if (result.ok) {
                setAgentDetails(result.value);
                setEditablePrompt(result.value.conversationConfig?.agent?.prompt?.prompt || '');
                setEditableFirstMessage(result.value.conversationConfig?.agent?.firstMessage || '');
              } else {
                setLoadError(result.error || 'Failed to load agent details');
              }
              setIsLoadingDetails(false);
            });
          }}
        >
          Retry
        </Button>
      </Alert>
    );
  }

  if (!agentDetails) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-8">
        <AlertCircle className="text-muted-foreground h-8 w-8" />
        <p className="text-muted-foreground">No agent details available</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Refresh Page
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h3 className="text-xl font-bold">{agentDetails.name}</h3>
        {agentDetails.agentId && <p className="text-muted-foreground">{agentDetails.agentId}</p>}
      </div>

      {loadError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>Unable to load agent settings</AlertDescription>
        </Alert>
      )}

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
                  If the conversation fails, ensure prompt overrides are enabled for this agent in
                  the ElevenLabs security settings dashboard.
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
              Make sure System Prompt & First Message overrides are enabled for this agent in the
              agent security tab
            </li>
            <li>Check your microphone permissions are granted</li>
            <li>Try refreshing the page and connecting again</li>
          </ul>
        </AlertDescription>
      </Alert>
    </>
  );
}
