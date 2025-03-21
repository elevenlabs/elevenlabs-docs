'use server';

import { ElevenLabsClient } from 'elevenlabs';
import { cookies } from 'next/headers';

import { env } from '@/env.mjs';
import { soundEffectSchema, TtsInput, ttsSchema } from '@/lib/schemas';
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

  const apiKey = env.ELEVENLABS_API_KEY;

  if (!apiKey)
    return Err('API key is missing. Please set the ELEVENLABS_API_KEY environment variable.');

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

export async function generateSpeech(data: TtsInput): Promise<Result<{ audioBase64: string }>> {
  const validationResult = ttsSchema.safeParse(data);

  if (!validationResult.success) {
    return Err(validationResult.error.errors[0].message);
  }

  const apiKey = env.ELEVENLABS_API_KEY;

  if (!apiKey)
    return Err('API key is missing. Please set the ELEVENLABS_API_KEY environment variable.');

  try {
    const client = new ElevenLabsClient({
      apiKey: apiKey,
    });

    const voiceSettings = {
      stability: data.stability,
      clarity: data.clarity,
      style: data.style,
      speed: data.speed || 1.0,
    };

    const audio = await client.textToSpeech.convert(data.voice_id, {
      text: data.text,
      model_id: data.model_id,
      voice_settings: voiceSettings,
    });

    const chunks: Buffer[] = [];
    for await (const chunk of audio) {
      chunks.push(Buffer.from(chunk));
    }
    const audioBase64 = Buffer.concat(chunks).toString('base64');

    return Ok({ audioBase64 });
  } catch (error) {
    console.error('generateSpeech failed:', error);
    return Err('An unexpected error occurred');
  }
}

export async function setApiKey(key: string | null): Promise<Result<void>> {
  const cookieStore = await cookies();

  try {
    if (key === null) {
      //TODO: simple encryption - iron session seal it with password (SS in next)
      cookieStore.delete('xi-api-key');
    } else {
      cookieStore.set('xi-api-key', key, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
      });
    }

    // For void return types, we just need {ok: true}
    return { ok: true } as Ok<void>;
  } catch (error) {
    console.error('setApiKey failed:', error);
    return Err('Failed to set API key');
  }
}

export async function getApiKey(): Promise<Result<string | null>> {
  const cookieStore = await cookies();
  const apiKey = cookieStore.get('xi-api-key')?.value;
  return Ok(apiKey ?? null);
}

export async function getVoices(): Promise<Result<Array<{ voice_id: string; name: string }>>> {
  const apiKey = env.ELEVENLABS_API_KEY;

  if (!apiKey)
    return Err('API key is missing. Please set the ELEVENLABS_API_KEY environment variable.');

  try {
    const client = new ElevenLabsClient({
      apiKey: apiKey,
    });

    const voices = await client.voices.getAll();

    const mappedVoices = voices.voices
      .filter((voice) => typeof voice.name === 'string') // Filter out voices without names
      .map((voice) => ({
        voice_id: voice.voice_id,
        name: voice.name as string,
      }));

    return Ok(mappedVoices);
  } catch (error) {
    console.error('getVoices failed:', error);
    return Err('Failed to fetch voices');
  }
}
