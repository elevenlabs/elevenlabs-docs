import { z } from 'zod';

export const TTS_MODELS = {
  V3: 'eleven_v3',
  MULTILINGUAL: 'eleven_multilingual_v2',
  FLASH: 'eleven_flash_v2_5',
} as const;

export const STT_MODELS = {
  SCRIBE_V1: 'scribe_v1',
  SCRIBE_V1_EXPERIMENTAL: 'scribe_v1_experimental',
} as const;

export const soundEffectSchema = z.object({
  text: z.string().min(1, 'Text is required').max(450, 'Text must be 450 characters or less'),
  durationSeconds: z.union([z.literal('auto'), z.number().min(0.5).max(22)]),
  promptInfluence: z
    .number()
    .min(0, 'Prompt influence must be between 0 and 1')
    .max(1, 'Prompt influence must be between 0 and 1'),
});

export type SoundEffectInput = z.infer<typeof soundEffectSchema>;

export const ttsSchema = z.object({
  text: z.string().min(1, 'Text is required').max(5000, 'Text must be 5000 characters or less'),
  voiceId: z.string().min(1, 'Voice ID is required'),
  modelId: z
    .enum([TTS_MODELS.V3, TTS_MODELS.MULTILINGUAL, TTS_MODELS.FLASH])
    .default(TTS_MODELS.V3),
  stability: z.number().min(0).max(1).default(0.5),
  similarityBoost: z.number().min(0).max(1).default(0.75),
  style: z.number().min(0).max(1).optional().default(0.35),
  speed: z.number().min(0.7).max(1.2).optional().default(1.0),
  useSpeakerBoost: z.boolean().optional().default(false),
});

export type TtsInput = z.infer<typeof ttsSchema>;

export const musicSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(500, 'Prompt must be 500 characters or less'),
  musicLength: z.number().min(5000).max(300000).default(30000), // 5 seconds to 5 minutes in milliseconds
  useCompositionPlan: z.boolean().default(false),
});

export type MusicInput = z.infer<typeof musicSchema>;

export const dialogueInputSchema = z.object({
  text: z.string().min(1, 'Text is required').max(1000, 'Text must be 1000 characters or less'),
  voiceId: z.string().min(1, 'Voice ID is required'),
});

export const dialogueSchema = z.object({
  inputs: z
    .array(dialogueInputSchema)
    .min(1, 'At least one dialogue input is required')
    .max(10, 'Maximum 10 dialogue inputs allowed'),
  modelId: z
    .enum([TTS_MODELS.V3, TTS_MODELS.MULTILINGUAL, TTS_MODELS.FLASH])
    .default(TTS_MODELS.V3),
  seed: z.number().min(0).max(4294967295).optional(),
});

export type DialogueInput = z.infer<typeof dialogueInputSchema>;
export type DialogueFormInput = z.infer<typeof dialogueSchema>;
