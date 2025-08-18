'use server';

import type { CreateSoundEffectRequest } from '@elevenlabs/elevenlabs-js/api';

import { getElevenLabsClient, handleError, streamToBase64 } from '@/app/actions/utils';
import { Err, Ok, Result } from '@/types';

export async function createSoundEffect(
  request: CreateSoundEffectRequest
): Promise<Result<{ audioBase64: string; processingTimeMs: number }>> {
  const startTime = performance.now();
  const clientResult = await getElevenLabsClient();
  if (!clientResult.ok) return Err(clientResult.error);

  try {
    const client = clientResult.value;
    const stream = await client.textToSoundEffects.convert(request);

    const audioBase64 = await streamToBase64(stream);

    const processingTimeMs = Math.round(performance.now() - startTime);

    return Ok({
      audioBase64: `data:audio/wav;base64,${audioBase64}`,
      processingTimeMs,
    });
  } catch (error) {
    return handleError(error, 'sound effect generation');
  }
}
