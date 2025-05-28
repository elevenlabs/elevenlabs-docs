'use server';

import type { TextToSpeechRequest } from '@elevenlabs/elevenlabs-js/api';
import { PassThrough } from 'stream';

import { getElevenLabsClient, handleError } from '@/app/actions/utils';
import { Err, Ok, Result } from '@/types';

export async function streamSpeech(
  voiceId: string,
  request: TextToSpeechRequest
): Promise<Result<ReadableStream<Uint8Array>>> {
  const clientResult = await getElevenLabsClient();
  if (!clientResult.ok) return Err(clientResult.error);

  try {
    const client = clientResult.value;
    const nodeStream = await client.textToSpeech.stream(voiceId, request);

    const passThrough = new PassThrough();

    (async () => {
      try {
        for await (const chunk of nodeStream) {
          const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
          passThrough.write(buffer);
        }
        passThrough.end();
      } catch (err) {
        passThrough.destroy(err instanceof Error ? err : new Error(String(err)));
      }
    })();

    // TODO: fix this, it's a hack to get around the fact that the SDK response is not a web stream
    const webStream = new ReadableStream<Uint8Array>({
      start(controller) {
        passThrough.on('data', (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk));
        });
        passThrough.on('end', () => {
          controller.close();
        });
        passThrough.on('error', (err) => {
          controller.error(err);
        });
      },
      cancel() {
        passThrough.destroy();
      },
    });

    return Ok(webStream);
  } catch (error) {
    return handleError(error, 'stream text to speech error');
  }
}
