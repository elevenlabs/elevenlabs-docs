import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    ELEVENLABS_API_KEY: z.string().min(1, 'ElevenLabs API key is required'),
  },
  client: {},
  runtimeEnv: {
    ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
  },
});
