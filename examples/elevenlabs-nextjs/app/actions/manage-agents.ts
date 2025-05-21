'use server';

import type {
  ConversationSignedUrlResponseModel,
  GetAgentResponseModel,
  GetAgentsPageResponseModel,
  conversationalAi,
} from '@elevenlabs/elevenlabs-js/api';

import { getElevenLabsClient, handleError } from '@/app/actions/utils';
import { Err, Ok, Result } from '@/types';

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
