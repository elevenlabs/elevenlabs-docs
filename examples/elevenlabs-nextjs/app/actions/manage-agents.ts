'use server';

import type {
  ConversationSignedUrlResponseModel,
  GetAgentResponseModel,
  GetAgentsPageResponseModel,
  conversationalAi,
} from '@elevenlabs/elevenlabs-js/api';

import { getElevenLabsClient, handleError } from '@/app/actions/utils';
import { env } from '@/env.mjs';
import { Err, Ok, Result } from '@/types';

import { getApiKey } from './manage-api-key';

export async function getAgentSignedUrl(
  request: conversationalAi.ConversationsGetSignedUrlRequest
): Promise<Result<ConversationSignedUrlResponseModel>> {
  const clientResult = await getElevenLabsClient();
  if (!clientResult.ok) return Err(clientResult.error);

  try {
    const client = clientResult.value;
    const response = await client.conversationalAi.conversations.getSignedUrl(request);
    return Ok(response);
  } catch (error) {
    return handleError(error, 'agent signed URL retrieval');
  }
}

export async function getAgents(): Promise<Result<GetAgentsPageResponseModel>> {
  const clientResult = await getElevenLabsClient();
  if (!clientResult.ok) return Err(clientResult.error);

  try {
    const client = clientResult.value;
    const response = await client.conversationalAi.agents.list();
    return Ok(response);
  } catch (error) {
    return handleError(error, 'all agent retrieval');
  }
}

export async function getAgent(agentId: string): Promise<Result<GetAgentResponseModel>> {
  const clientResult = await getElevenLabsClient();
  if (!clientResult.ok) return Err(clientResult.error);

  try {
    const client = clientResult.value;
    const response = await client.conversationalAi.agents.get(agentId);
    return Ok(response);
  } catch (error) {
    return handleError(error, 'agent retrieval');
  }
}

export async function getConversationToken(agentId: string): Promise<Result<{ token: string }>> {
  const userKeyResult = await getApiKey();
  const userApiKey = userKeyResult.ok ? userKeyResult.value : null;

  const apiKey = userApiKey || env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return Err(
      'API key is missing. Please set your API key in the app or configure the ELEVENLABS_API_KEY environment variable.'
    );
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agentId}`,
    {
      headers: {
        'xi-api-key': apiKey,
      },
    }
  );

  const data = await response.json();

  return Ok({ token: data.token });
}
