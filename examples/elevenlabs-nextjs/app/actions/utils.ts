import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

import { getApiKey } from '@/app/actions/manage-api-key';
import { env } from '@/env.mjs';
import { Err, Ok, Result } from '@/types';

export async function getElevenLabsClient(): Promise<Result<ElevenLabsClient>> {
  try {
    const userKeyResult = await getApiKey();
    const userApiKey = userKeyResult.ok ? userKeyResult.value : null;

    const apiKey = userApiKey || env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return Err(
        'API key is missing. Please set your API key in the app or configure the ELEVENLABS_API_KEY environment variable.'
      );
    }

    return Ok(new ElevenLabsClient({ apiKey }));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return Err(`ElevenLabs client initialization failed: ${errorMessage}`);
  }
}

export function handleError(error: unknown, context: string): Result<never> {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return Err(`Failed to ${context}: ${errorMessage}`);
}
