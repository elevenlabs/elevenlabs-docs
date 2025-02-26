'use server';

import { ElevenLabsClient } from 'elevenlabs';
import { cookies } from 'next/headers';

import { env } from '@/env.mjs';
import { soundEffectSchema } from '@/lib/schemas';
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

    return Ok();
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
