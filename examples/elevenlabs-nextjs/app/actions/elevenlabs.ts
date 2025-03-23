'use server';

import { ElevenLabsClient } from 'elevenlabs';
import * as ElevenLabs from 'elevenlabs/api';

import { env } from '@/env.mjs';
import { Err, Ok, Result } from '@/types';

let clientInstance: ElevenLabsClient | null = null;

export async function generateSpeech(
  voiceId: string,
  request: ElevenLabs.TextToSpeechRequest
): Promise<Result<{ audioBase64: string }>> {
  const clientResult = getElevenLabsClient();
  if (!clientResult.ok) return Err(clientResult.error);
  try {
    const client = clientResult.value;
    const audioStream = await client.textToSpeech.convert(voiceId, request);

    const audioBase64 = await streamToBase64(audioStream);
    return Ok({ audioBase64 });
  } catch (error) {
    return handleError(error, 'text-to-speech conversion');
  }
}

export async function getVoices(): Promise<Result<ElevenLabs.GetVoicesResponse>> {
  const clientResult = getElevenLabsClient();
  if (!clientResult.ok) return Err(clientResult.error);

  try {
    const client = clientResult.value;
    const voices = await client.voices.getAll();
    return Ok(voices);
  } catch (error) {
    return handleError(error, 'voice retrieval');
  }
}

export async function getVoiceById(voiceId: string): Promise<Result<ElevenLabs.Voice>> {
  const clientResult = getElevenLabsClient();
  if (!clientResult.ok) return Err(clientResult.error);

  try {
    const client = clientResult.value;
    const voice = await client.voices.get(voiceId);

    if (!voice) return Err(`Voice with ID ${voiceId} not found`);
    return Ok(voice);
  } catch (error) {
    return handleError(error, `retrieve voice ${voiceId}`);
  }
}

export async function generateSoundEffect(
  prompt: string,
  duration: number | 'auto' = 'auto',
  promptInfluence: number = 0.5
): Promise<Result<{ audioBase64: string }>> {
  const clientResult = getElevenLabsClient();
  if (!clientResult.ok) return Err(clientResult.error);

  try {
    const params: ElevenLabs.BodySoundGenerationV1SoundGenerationPost = {
      text: prompt,
      prompt_influence: promptInfluence,
      ...(duration !== 'auto' && { duration_seconds: duration }),
    };

    const client = clientResult.value;
    const audioStream = await client.textToSoundEffects.convert(params);

    const audioBase64 = await streamToBase64(audioStream);
    return Ok({ audioBase64 });
  } catch (error) {
    return handleError(error, 'sound effect generation');
  }
}

export async function transcribeAudio(
  file: File,
  options?: Partial<Omit<ElevenLabs.BodySpeechToTextV1SpeechToTextPost, 'file'>>
): Promise<Result<ElevenLabs.SpeechToTextChunkResponseModel>> {
  const startTime = performance.now();
  const clientResult = getElevenLabsClient();
  if (!clientResult.ok) return Err(clientResult.error);

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const blob = new Blob([buffer]);

    const finalOptions: ElevenLabs.BodySpeechToTextV1SpeechToTextPost = {
      file: blob,
      model_id: 'scribe_v1',
      tag_audio_events: true,
      timestamps_granularity: 'word' as const,
      diarize: true,
      ...options,
    };

    const client = clientResult.value;
    const result = await client.speechToText.convert(finalOptions);
    const processingTimeMs = Math.round(performance.now() - startTime);

    return Ok({
      text: result.text,
      words: result.words,
      language_code: result.language_code,
      language_probability: result.language_probability,
      processingTimeMs,
    });
  } catch (error) {
    return handleError(error, 'audio transcription');
  }
}

export async function getAgentSignedUrl(agentId: string): Promise<Result<string>> {
  const clientResult = getElevenLabsClient();
  if (!clientResult.ok) return Err(clientResult.error);

  try {
    const client = clientResult.value;
    const response = await client.conversationalAi.getSignedUrl({
      agent_id: agentId,
    });
    return Ok(response.signed_url);
  } catch (error) {
    return handleError(error, 'agent signed URL retrieval');
  }
}

export async function getAgents(): Promise<Result<ElevenLabs.AgentSummaryResponseModel[]>> {
  const clientResult = getElevenLabsClient();
  if (!clientResult.ok) return Err(clientResult.error);

  try {
    const client = clientResult.value;
    const response = await client.conversationalAi.getAgents({});
    return Ok(response.agents);
  } catch (error) {
    return handleError(error, 'all agent retrieval');
  }
}

export async function getAgent(agentId: string): Promise<Result<ElevenLabs.GetAgentResponseModel>> {
  const clientResult = getElevenLabsClient();
  if (!clientResult.ok) return Err(clientResult.error);

  try {
    const client = clientResult.value;
    const response = await client.conversationalAi.getAgent(agentId);
    return Ok(response);
  } catch (error) {
    return handleError(error, 'agent retrieval');
  }
}

function getElevenLabsClient(): Result<ElevenLabsClient> {
  if (clientInstance) return Ok(clientInstance);

  const apiKey = env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return Err('API key is missing. Please set the ELEVENLABS_API_KEY environment variable.');
  }

  try {
    clientInstance = new ElevenLabsClient({ apiKey });
    return Ok(clientInstance);
  } catch (error) {
    console.error('Failed to initialize ElevenLabs client:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return Err(`ElevenLabs client initialization failed: ${errorMessage}`);
  }
}

function handleError(error: unknown, context: string): Result<never> {
  console.error(`ElevenLabs ${context} failed:`, error);
  const errorMessage = error instanceof Error ? error.message : String(error);
  return Err(`Failed to ${context}: ${errorMessage}`);
}

async function streamToBase64(audioStream: NodeJS.ReadableStream): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of audioStream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('base64');
}
