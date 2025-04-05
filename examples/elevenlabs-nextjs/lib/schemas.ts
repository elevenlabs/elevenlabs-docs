import { z } from 'zod';

export const TTS_MODELS = {
  MULTILINGUAL: 'eleven_multilingual_v2',
  FLASH: 'eleven_flash_v2_5',
} as const;

export const STT_MODELS = {
  SCRIBE_V1: 'scribe_v1',
} as const;

export const soundEffectSchema = z.object({
  text: z.string().min(1, 'Text is required').max(450, 'Text must be 450 characters or less'),
  duration_seconds: z.union([z.literal('auto'), z.number().min(0.5).max(22)]),
  prompt_influence: z
    .number()
    .min(0, 'Prompt influence must be between 0 and 1')
    .max(1, 'Prompt influence must be between 0 and 1'),
});

export type SoundEffectInput = z.infer<typeof soundEffectSchema>;

export const ttsSchema = z.object({
  text: z.string().min(1, 'Text is required').max(5000, 'Text must be 5000 characters or less'),
  voice_id: z.string().min(1, 'Voice ID is required'),
  model_id: z.enum([TTS_MODELS.MULTILINGUAL, TTS_MODELS.FLASH]).default(TTS_MODELS.MULTILINGUAL),
  stability: z.number().min(0).max(1).default(0.5),
  similarity_boost: z.number().min(0).max(1).default(0.75),
  style: z.number().min(0).max(1).optional().default(0.35),
  speed: z.number().min(0.7).max(1.2).optional().default(1.0),
  use_speaker_boost: z.boolean().optional().default(false),
});

export type TtsInput = z.infer<typeof ttsSchema>;
