'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDownIcon, FastForwardIcon, PauseIcon, PlayIcon, RewindIcon } from 'lucide-react';
import { observer } from 'mobx-react';
import React, { useEffect, useState, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { formatTimeInSeconds } from '@/lib/time';
import { signal } from '@/lib/utils';

export type SimpleAudioInfo = {
  title: string;
  audioUrl: string;
  slug: string;
  description?: string;
};

// Global state
export const isPlaying = signal(false);
export const isOpen = signal(false);
export const audioRef = signal<HTMLAudioElement | null>(null);
export const currentAudio = signal<SimpleAudioInfo | null>(null);

// Helper functions
export function playAudio() {
  if (audioRef.get() === null) {
    return;
  }
  audioRef.get()!.play();
}

export function pauseAudio() {
  if (audioRef.get() === null) {
    return;
  }
  audioRef.get()!.pause();
}

export function toggleAudio() {
  if (isPlaying.get()) {
    pauseAudio();
  } else {
    playAudio();
  }
}

export function loadAndPlay(audioInfo: SimpleAudioInfo) {
  currentAudio.set(audioInfo);
  isOpen.set(true);
  // The audio will automatically start playing when loaded due to autoPlay
}

export function closePlayer() {
  if (audioRef.get()) {
    audioRef.get()!.pause();
    audioRef.get()!.src = '';
  }
  isPlaying.set(false);
  isOpen.set(false);
  currentAudio.set(null);
}

const PlayButtonIcon = ({
  isLoading,
  isPlayingState,
}: {
  isLoading: boolean;
  isPlayingState: boolean;
}) => {
  if (isLoading) {
    return (
      <motion.div
        key="loading"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
      </motion.div>
    );
  }

  if (isPlayingState) {
    return (
      <motion.div
        key="pause"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        <PauseIcon className="h-5 w-5" />
      </motion.div>
    );
  }

  return (
    <motion.div
      key="play"
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.5, opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <PlayIcon className="h-5 w-5 translate-x-[5%]" />
    </motion.div>
  );
};

export const SimpleAudioPlayer = observer(() => {
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const thisAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isPlaying.get()) {
      const interval = setInterval(() => {
        if (!isPlaying.get() || audioRef.get() === null) {
          clearInterval(interval);
        } else {
          setCurrentTime(audioRef.get()!.currentTime);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isPlaying.get()]);

  useEffect(() => {
    return () => {
      if (audioRef.get() === thisAudioRef.current) {
        audioRef.set(null);
      }
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen.get()) return;

      if (e.key === ' ') {
        e.preventDefault();
        toggleAudio();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (audioRef.get()) {
          audioRef.get()!.currentTime = Math.max(0, audioRef.get()!.currentTime - 10);
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (audioRef.get()) {
          audioRef.get()!.currentTime = Math.min(
            audioRef.get()!.duration,
            audioRef.get()!.currentTime + 10
          );
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen.get() || !currentAudio.get()) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.42, 0, 0.58, 1] }}
        className="bg-background fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 shadow-lg"
      >
        {/* biome-ignore lint/a11y/useMediaCaption: <explanation> */}
        <audio
          ref={(ref) => {
            thisAudioRef.current = ref;
            if (ref !== null && ref !== audioRef.get()) {
              audioRef.set(ref);
            }
          }}
          src={currentAudio.get()!.audioUrl}
          autoPlay
          onPlay={() => {
            isPlaying.set(true);
            setIsLoading(false);
          }}
          onPause={() => {
            isPlaying.set(false);
          }}
          onEnded={() => {
            isPlaying.set(false);
            setCurrentTime(0);
          }}
          onLoadStart={() => {
            setIsLoading(true);
          }}
          onCanPlay={() => {
            setIsLoading(false);
          }}
          onTimeUpdate={(e) => {
            const audio = e.target as HTMLAudioElement;
            setCurrentTime(audio.currentTime);
          }}
          onDurationChange={(e) => {
            const audio = e.target as HTMLAudioElement;
            setDuration(audio.duration);
          }}
        />

        <div className="flex items-center gap-4 px-4 py-3">
          {/* Play/Pause Button */}
          <Button
            onClick={toggleAudio}
            size="icon"
            className="h-12 w-12 rounded-full bg-black text-white transition-transform hover:scale-105 dark:bg-white dark:text-black"
            aria-label={isPlaying.get() ? 'Pause' : 'Play'}
          >
            <AnimatePresence>
              <PlayButtonIcon isLoading={isLoading} isPlayingState={isPlaying.get()} />
            </AnimatePresence>
          </Button>

          {/* Rewind Button */}
          <Button
            onClick={() => {
              if (audioRef.get()) {
                audioRef.get()!.currentTime = Math.max(0, audioRef.get()!.currentTime - 10);
              }
            }}
            variant="ghost"
            size="icon"
            className="hidden h-9 w-9 md:flex"
            aria-label="Rewind 10 seconds"
          >
            <RewindIcon className="h-4 w-4" />
          </Button>

          {/* Forward Button */}
          <Button
            onClick={() => {
              if (audioRef.get()) {
                audioRef.get()!.currentTime = Math.min(
                  audioRef.get()!.duration,
                  audioRef.get()!.currentTime + 10
                );
              }
            }}
            variant="ghost"
            size="icon"
            className="hidden h-9 w-9 md:flex"
            aria-label="Forward 10 seconds"
          >
            <FastForwardIcon className="h-4 w-4" />
          </Button>

          {/* Title and Time */}
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="truncate text-sm font-medium">{currentAudio.get()!.title}</h3>
                {currentAudio.get()!.description && (
                  <p className="hidden truncate text-xs text-[#878787] md:block">
                    {currentAudio.get()!.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{formatTimeInSeconds(currentTime)}</span>
                <span>/</span>
                <span>{formatTimeInSeconds(duration)}</span>
              </div>
            </div>

            {/* Progress Slider */}
            <Slider
              value={[currentTime]}
              max={duration || 1}
              step={0.1}
              onValueChange={(value) => {
                if (audioRef.get()) {
                  audioRef.get()!.currentTime = value[0];
                }
              }}
              className="w-full"
            />
          </div>

          {/* Close Button */}
          <Button
            onClick={closePlayer}
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            aria-label="Close player"
          >
            <ChevronDownIcon className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
});
