'use server';

import { getElevenLabsClient, handleError } from '@/app/actions/utils';
import { Err, Ok, Result } from '@/types';

export interface CreateMusicRequest {
  prompt: string;
  musicLengthMs: number;
}

export async function createMusic(
  request: CreateMusicRequest
): Promise<Result<{ audioBase64: string; processingTimeMs: number }>> {
  const startTime = performance.now();
  const clientResult = await getElevenLabsClient();
  if (!clientResult.ok) return Err(clientResult.error);

  try {
    const client = clientResult.value;
    const stream = await client.music.compose({
      prompt: request.prompt,
      musicLengthMs: request.musicLengthMs,
    });

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

async function streamToBase64(audioStream: ReadableStream<Uint8Array>): Promise<string> {
  const chunks: Uint8Array[] = [];
  const reader = audioStream.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }

  return Buffer.from(combined).toString('base64');
}
