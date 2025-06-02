import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    ELEVENLABS_API_KEY: z.string().optional(),
    IRON_SESSION_SECRET_KEY: z
      .string()
      .min(32, 'Session secret key should be at least 32 characters long'),
    ELEVENLABS_API_BASE_URL: z.string().optional().default('https://api.elevenlabs.io'),
    ANTHROPIC_API_KEY: z.string().optional(),
  },
  client: {},
  runtimeEnv: {
    ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
    IRON_SESSION_SECRET_KEY: process.env.IRON_SESSION_SECRET_KEY,
    ELEVENLABS_API_BASE_URL: process.env.ELEVENLABS_API_BASE_URL,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  },
});
