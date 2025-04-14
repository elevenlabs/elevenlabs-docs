'use client';

import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

interface AudioPlayerProps {
  audioBase64: string;
  autoplay?: boolean;
  className?: string;
}

export function AudioPlayer({ audioBase64, autoplay = true, className }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!audioBase64) {
      setError('No audio source provided');
      return;
    }

    if (audioRef.current) {
      const audio = audioRef.current;
      setError(null);

      try {
        // Check if the audioBase64 is already a URL (starts with http, https, blob:, or data:)
        const isUrl = /^(http|https|blob:|data:)/.test(audioBase64);

        // If it's not a URL, assume it's base64 data and create a data URL
        const srcUrl = isUrl ? audioBase64 : `data:audio/wav;base64,${audioBase64}`;

        // Only update if the URL has changed
        if (audio.src !== srcUrl) {
          audio.src = srcUrl;
          audio.load();
        }

        if (autoplay) {
          const playPromise = audio.play();

          if (playPromise !== undefined) {
            playPromise.catch((err) => {
              console.error('Failed to autoplay audio:', err);
              setError('Failed to play audio');
            });
          }
        }
      } catch (err) {
        console.error('Error setting audio source:', err);
        setError('Error loading audio');
      }
    }
  }, [audioBase64, autoplay]);

  return (
    <div className={cn('flex w-full flex-col items-center space-y-2', className)}>
      {error ? (
        <div className="text-sm text-red-500">{error}</div>
      ) : (
        <audio ref={audioRef} controls className="w-full" />
      )}
    </div>
  );
}
