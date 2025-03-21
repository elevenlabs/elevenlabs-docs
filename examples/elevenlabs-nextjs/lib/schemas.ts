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

// Available TTS models
export const TTS_MODELS = {
  MULTILINGUAL: 'eleven_multilingual_v2',
  FLASH: 'eleven_flash_v2_5',
} as const;

// TTS model names and descriptions for display
export const TTS_MODEL_INFO = {
  [TTS_MODELS.MULTILINGUAL]: {
    name: 'High Quality',
    description: 'Superior quality, slower generation',
  },
  [TTS_MODELS.FLASH]: {
    name: 'Flash',
    description: 'Faster generation at 50% off, good quality',
  },
};

// A list of pre-selected voices to make selection easier
export const FEATURED_VOICES = [
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', accent: 'American' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', accent: 'American' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Adam', accent: 'American' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Nicole', accent: 'American' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', accent: 'American' },
  { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', accent: 'American' },
  { id: 'jBpfuIE2acCO8z3wKNLl', name: 'Callum', accent: 'British' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Charlotte', accent: 'British' },
];

export const ttsSchema = z.object({
  text: z.string().min(1, 'Text is required').max(5000, 'Text must be 5000 characters or less'),
  voice_id: z.string().min(1, 'Voice ID is required'),
  model_id: z.enum([TTS_MODELS.MULTILINGUAL, TTS_MODELS.FLASH]).default(TTS_MODELS.MULTILINGUAL),
  stability: z.number().min(0).max(1).default(0.5),
  clarity: z.number().min(0).max(1).default(0.75),
  style: z.number().min(0).max(1).optional().default(0.35),
  speed: z.number().min(0.7).max(1.2).optional().default(1.0),
});

export type TtsInput = z.infer<typeof ttsSchema>;
