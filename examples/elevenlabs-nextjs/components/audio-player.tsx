'use client';

import WavesurferPlayer from '@wavesurfer/react';
import { PlayIcon, PauseIcon, Download } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import React from 'react';
import WaveSurfer from 'wavesurfer.js';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AudioPlayerProps {
  audioBase64: string;
  className?: string;
  autoplay?: boolean;
}

export function AudioPlayer({ audioBase64, className, autoplay }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('00.00');
  const [wavesurfer, setWavesurfer] = useState<WaveSurfer | null>(null);

  const handleTimeUpdate = (wavesurfer: WaveSurfer) => {
    const time = wavesurfer.getCurrentTime();
    const formatted = `${String(Math.floor(time)).padStart(2, '0')}.${String(
      Math.floor((time % 1) * 100)
    ).padStart(2, '0')}`;
    setCurrentTime(formatted);
  };

  const handleDownload = () => {
    const audioData = `data:audio/mp3;base64,${audioBase64}`;
    const link = document.createElement('a');
    link.href = audioData;
    link.download = 'audio.mp3';
    link.click();
  };

  const handlePlay = useCallback(() => {
    if (wavesurfer && !isPlaying) {
      wavesurfer.play().catch(() => {
        console.log('Error playing audio');
      });
    }
  }, [wavesurfer, isPlaying]);

  // Fixed autoplay effect to prevent infinite loops
  // Using a ref to track if we've already autoplayed for this audioBase64
  const hasAutoplayedRef = React.useRef<string | null>(null);

  useEffect(() => {
    // Only autoplay if:
    // 1. We have a wavesurfer instance
    // 2. Autoplay is enabled
    // 3. We haven't already autoplayed this exact audio (by comparing audioBase64)
    if (wavesurfer && autoplay && hasAutoplayedRef.current !== audioBase64) {
      hasAutoplayedRef.current = audioBase64;
      handlePlay();
    }
  }, [audioBase64, autoplay, wavesurfer, handlePlay]);

  return (
    <div className={cn('space-y-4', className)}>
      <div className="bg-card h-[120px] w-full overflow-hidden rounded-lg">
        <div id="timeline"></div>
        <WavesurferPlayer
          height={120}
          waveColor="#666666"
          progressColor="#999999"
          cursorColor="#fff"
          barWidth={2}
          barGap={1}
          barRadius={3}
          url={`data:audio/mp3;base64,${audioBase64}`}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeupdate={handleTimeUpdate}
          onFinish={() => setIsPlaying(false)}
          onReady={(wavesurfer) => {
            if (wavesurfer) {
              setWavesurfer(wavesurfer);
            }
          }}
        />
      </div>
      <AudioControls
        isPlaying={isPlaying}
        currentTime={currentTime}
        onDownload={handleDownload}
        onPlayPause={() => wavesurfer && wavesurfer.playPause()}
      />
    </div>
  );
}

function AudioControls({
  isPlaying,
  currentTime,
  onDownload,
  onPlayPause,
}: {
  isPlaying: boolean;
  currentTime: string;
  onDownload: () => void;
  onPlayPause: () => void;
}) {
  return (
    <div className="flex items-center justify-center gap-4">
      <Button onClick={onPlayPause} size="icon" className="h-8 w-8 rounded-full">
        {isPlaying ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
      </Button>
      <span className="font-mono text-sm">{currentTime}</span>
      <span className="text-muted-foreground text-sm">MP3</span>
      <Button onClick={onDownload} size="icon" variant="ghost" className="h-8 w-8">
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
}
