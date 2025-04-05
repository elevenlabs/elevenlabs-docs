'use server';

import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

import { env } from '@/env.mjs';
import { Err, Ok, Result } from '@/types';

interface SecurityData {
  apiKey?: string;
}

const sessionOptions = {
  password: env.IRON_SESSION_SECRET_KEY,
  cookieName: 'elevenlabs-session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};

export async function setApiKey(key: string | null): Promise<Result<void>> {
  try {
    const session = await getIronSession<SecurityData>(await cookies(), sessionOptions);

    if (key === null) {
      delete session.apiKey;
    } else {
      session.apiKey = key;
    }

    await session.save();
    return { ok: true } as Ok<void>;
  } catch (error) {
    console.error('API key management failed:', error);
    return Err('Failed to set API key');
  }
}

export async function getApiKey(): Promise<Result<string | null>> {
  try {
    const session = await getIronSession<SecurityData>(await cookies(), sessionOptions);
    return Ok(session.apiKey || null);
  } catch (error) {
    console.error('Failed to retrieve API key:', error);
    return Err('Failed to retrieve API key');
  }
}
