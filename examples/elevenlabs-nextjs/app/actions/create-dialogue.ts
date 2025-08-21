'use server';

import { getElevenLabsClient, handleError, streamToBase64 } from '@/app/actions/utils';
import { Err, Ok, Result } from '@/types';

export interface DialogueInput {
  text: string;
  voiceId: string;
}

export interface CreateDialogueRequest {
  inputs: DialogueInput[];
  modelId?: string;
  seed?: number;
}

export async function createDialogue(
  request: CreateDialogueRequest
): Promise<Result<{ audioBase64: string; processingTimeMs: number }>> {
  const startTime = performance.now();
  const clientResult = await getElevenLabsClient();
  if (!clientResult.ok) return Err(clientResult.error);

  try {
    const client = clientResult.value;

    // Prepare the dialogue request according to the API specification
    const dialogueRequest = {
      inputs: request.inputs.map((input) => ({
        text: input.text,
        voiceId: input.voiceId,
      })),
      modelId: request.modelId || 'eleven_v3',
      ...(request.seed && { seed: request.seed }),
    };

    const stream = await client.textToDialogue.convert(dialogueRequest);

    const audioBase64 = await streamToBase64(stream);

    const processingTimeMs = Math.round(performance.now() - startTime);

    return Ok({
      audioBase64: `data:audio/mpeg;base64,${audioBase64}`,
      processingTimeMs,
    });
  } catch (error) {
    return handleError(error, 'dialogue generation');
  }
}
