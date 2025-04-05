'use client';

import { useEffect, useRef } from 'react';

interface AudioPlayerProps {
  url: string | null;
  onPlayStateChange: (isPlaying: boolean) => void;
  onTimeUpdate: (currentTime: number) => void;
  onAudioRef: (ref: HTMLAudioElement | null) => void;
}

export function AudioPlayer({
  url,
  onPlayStateChange,
  onTimeUpdate,
  onAudioRef,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    onAudioRef(audioElement);

    const handlePlay = () => {
      onPlayStateChange(true);
    };

    const handlePause = () => {
      onPlayStateChange(false);
    };

    const handleEnded = () => {
      onPlayStateChange(false);
      onTimeUpdate(0);
    };

    const handleTimeUpdate = () => {
      onTimeUpdate(audioElement.currentTime);
    };

    audioElement.addEventListener('play', handlePlay);
    audioElement.addEventListener('pause', handlePause);
    audioElement.addEventListener('ended', handleEnded);
    audioElement.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      audioElement.removeEventListener('play', handlePlay);
      audioElement.removeEventListener('pause', handlePause);
      audioElement.removeEventListener('ended', handleEnded);
      audioElement.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [onPlayStateChange, onTimeUpdate, onAudioRef]);

  if (!url) return null;

  return <audio ref={audioRef} src={url} className="w-full" controls={true} preload="auto" />;
}
