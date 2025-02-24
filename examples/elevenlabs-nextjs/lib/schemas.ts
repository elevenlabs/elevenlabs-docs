import { z } from 'zod';

export const soundEffectSchema = z.object({
  text: z.string().min(1, 'Text is required').max(450, 'Text must be 450 characters or less'),
  duration_seconds: z.union([z.literal('auto'), z.number().min(0.5).max(22)]),
  prompt_influence: z
    .number()
    .min(0, 'Prompt influence must be between 0 and 1')
    .max(1, 'Prompt influence must be between 0 and 1'),
});

export type SoundEffectInput = z.infer<typeof soundEffectSchema>;
