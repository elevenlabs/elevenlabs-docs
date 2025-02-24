'use server';

import { ElevenLabsClient } from 'elevenlabs';
import { cookies } from 'next/headers';

import { env } from '@/env.mjs';
import { Models, soundEffectSchema, textToSpeechSchema } from '@/lib/schemas';
import { Err, Ok, Result } from '@/types';

export async function generateSoundEffect(
  prompt: string,
  duration: number | 'auto',
  promptInfluence: number
): Promise<Result<{ audioBase64: string }>> {
  const validationResult = soundEffectSchema.safeParse({
    text: prompt,
    duration_seconds: duration,
    prompt_influence: promptInfluence,
  });

  if (!validationResult.success) {
    return Err(validationResult.error.errors[0].message);
  }

  const cookieStore = await cookies();
  const apiKey = cookieStore.get('xi-api-key')?.value ?? env.ELEVENLABS_API_KEY;

  if (!apiKey) return Err('API key is missing.');

  try {
    const client = new ElevenLabsClient({
      apiKey: apiKey,
    });

    const audio = await client.textToSoundEffects.convert({
      text: prompt,
      prompt_influence: promptInfluence,
      ...(duration !== 'auto' && { duration_seconds: duration }),
    });

    const chunks: Buffer[] = [];
    for await (const chunk of audio) {
      chunks.push(Buffer.from(chunk));
    }
    const audioBase64 = Buffer.concat(chunks).toString('base64');

    return Ok({ audioBase64 });
  } catch (error) {
    console.error('generateSoundEffect failed:', error);
    return Err('An unexpected error occurred');
  }
}

export async function generateTextToSpeech(
  text: string,
  modelId: Models,
  voiceId: string
): Promise<Result<{ audioBase64: string }>> {
  const validationResult = textToSpeechSchema.safeParse({
    text: text,
    model_id: modelId,
  });

  if (!validationResult.success) {
    return Err(validationResult.error.errors[0].message);
  }

  const cookieStore = await cookies();
  const apiKey = cookieStore.get('xi-api-key')?.value ?? env.ELEVENLABS_API_KEY;

  if (!apiKey) return Err('API key is missing.');

  try {
    const client = new ElevenLabsClient({
      apiKey: apiKey,
    });

    const audio = await client.textToSpeech.convert('JBFqnCBsd6RMkjVDRZzb', {
      output_format: 'mp3_44100_128',
      text: 'The first move is what sets everything in motion.',
      model_id: 'eleven_multilingual_v2',
    });

    const chunks: Buffer[] = [];
    for await (const chunk of audio) {
      chunks.push(Buffer.from(chunk));
    }
    const audioBase64 = Buffer.concat(chunks).toString('base64');

    return Ok({ audioBase64 });
  } catch (error) {
    console.error('generateTextToSpeech failed:', error);
    return Err('An unexpected error occurred');
  }
}
