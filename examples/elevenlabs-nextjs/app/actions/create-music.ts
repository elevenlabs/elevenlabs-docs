'use server';

import { CompositionPlan } from '@/app/actions/create-composition-plan';
import { getElevenLabsClient, handleError, streamToBase64 } from '@/app/actions/utils';
import { Err, Ok, Result } from '@/types';

export interface CreateMusicRequest {
  prompt?: string;
  musicLengthMs: number;
  compositionPlan?: CompositionPlan;
}

export async function createMusic(
  request: CreateMusicRequest
): Promise<Result<{ audioBase64: string; processingTimeMs: number }>> {
  const startTime = performance.now();
  const clientResult = await getElevenLabsClient();
  if (!clientResult.ok) return Err(clientResult.error);

  try {
    const client = clientResult.value;

    // Use composition plan if provided, otherwise use prompt
    const composeParams = request.compositionPlan
      ? { compositionPlan: request.compositionPlan }
      : { prompt: request.prompt!, musicLengthMs: request.musicLengthMs };

    const stream = await client.music.compose(composeParams);

    const audioBase64 = await streamToBase64(stream);

    const processingTimeMs = Math.round(performance.now() - startTime);

    return Ok({
      audioBase64: `data:audio/wav;base64,${audioBase64}`,
      processingTimeMs,
    });
  } catch (error) {
    return handleError(error, 'music generation');
  }
}
