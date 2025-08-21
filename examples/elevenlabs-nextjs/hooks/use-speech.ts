'use client';

import type { TextToSpeechRequest } from '@elevenlabs/elevenlabs-js/api';
import { useState, useCallback } from 'react';

import { generateSpeech } from '@/app/actions/create-speech';

type UseSpeechOptions = {
  onError?: (error: string) => void;
};

export function useSpeech(options: UseSpeechOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Generate speech from text using ElevenLabs API
   * @param voiceId The voice ID to use for generation
   * @param request The text-to-speech request parameters
   * @returns A blob URL to the generated audio, or null if generation failed
   */
  const speak = useCallback(
    async (voiceId: string, request: TextToSpeechRequest): Promise<string | null> => {
      if (isLoading) return null;

      setIsLoading(true);
      setError(null);

      try {
        const result = await generateSpeech(voiceId, request);

        if (!result.ok) {
          throw new Error(result.error);
        }

        return result.value.audioBase64;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        options.onError?.(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, options]
  );

  return {
    speak,
    isLoading,
    error,
  };
}
