import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    ELEVENLABS_API_KEY: z.string().optional(),
    IRON_SESSION_SECRET_KEY: z
      .string()
      .min(32, 'Session secret key should be at least 32 characters long'),
  },
  client: {},
  runtimeEnv: {
    ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
    IRON_SESSION_SECRET_KEY: process.env.IRON_SESSION_SECRET_KEY,
  },
});
