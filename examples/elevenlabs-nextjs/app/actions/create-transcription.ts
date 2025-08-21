"use server";

import type { BodySpeechToTextV1SpeechToTextPost } from "@elevenlabs/elevenlabs-js/api";

import { getElevenLabsClient, handleError } from "@/app/actions/utils";
import { Err, Ok, Result } from "@/types";

export async function createTranscription(
  request: BodySpeechToTextV1SpeechToTextPost
): Promise<Result<{ processingTimeMs: number; [key: string]: unknown }>> {
  const startTime = performance.now();
  const clientResult = await getElevenLabsClient();
  if (!clientResult.ok) return Err(clientResult.error);

  try {
    const client = clientResult.value;
    const transcription = await client.speechToText.convert(request);

    return Ok({
      ...transcription,
      processingTimeMs: performance.now() - startTime,
    });
  } catch (error) {
    return handleError(error, "audio transcription");
  }
}
