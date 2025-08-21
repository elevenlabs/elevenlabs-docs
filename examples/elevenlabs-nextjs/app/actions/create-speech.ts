'use server';

import type { TextToSpeechRequest } from '@elevenlabs/elevenlabs-js/api';

import { getElevenLabsClient, handleError, streamToBase64 } from '@/app/actions/utils';
import { Err, Ok, Result } from '@/types';

export async function generateSpeech(
  voiceId: string,
  request: TextToSpeechRequest
): Promise<Result<{ audioBase64: string; processingTimeMs: number }>> {
  const startTime = performance.now();
  const clientResult = await getElevenLabsClient();
  if (!clientResult.ok) return Err(clientResult.error);

  try {
    const client = clientResult.value;
    const audioStream = await client.textToSpeech.convert(voiceId, request);

    const audioBase64 = await streamToBase64(audioStream);

    const processingTimeMs = Math.round(performance.now() - startTime);

    return Ok({
      audioBase64: `data:audio/mpeg;base64,${audioBase64}`,
      processingTimeMs,
    });
  } catch (error) {
    return handleError(error, 'text to speech generation');
  }
}
