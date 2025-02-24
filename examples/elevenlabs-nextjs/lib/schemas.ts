import { z } from 'zod';

export enum Models {
  Flash = 'eleven_flash_v2',
  Multilingual = 'eleven_multilingual_v2',
}

export const soundEffectSchema = z.object({
  text: z.string().min(1, 'Text is required').max(450, 'Text must be 450 characters or less'),
  duration_seconds: z.union([z.literal('auto'), z.number().min(0.5).max(22)]),
  prompt_influence: z
    .number()
    .min(0, 'Prompt influence must be between 0 and 1')
    .max(1, 'Prompt influence must be between 0 and 1'),
});

export type SoundEffectInput = z.infer<typeof soundEffectSchema>;

export const textToSpeechSchema = z.object({
  text: z.string().min(1, 'Text is required').max(450, 'Text must be 450 characters or less'),
  model_id: z.enum([Models.Flash, Models.Multilingual]),
});

export type TextToSpeechInput = z.infer<typeof textToSpeechSchema>;
