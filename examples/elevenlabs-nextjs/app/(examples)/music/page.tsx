'use client';

import { formatDistanceToNow } from 'date-fns';
import { nanoid } from 'nanoid';
import Image from 'next/image';
import { useState } from 'react';

import { AudioPlayer } from '@/app/(examples)/text-to-speech/components/audio-player';
import { MusicPromptBar, type Music } from '@/components/prompt-bar/music';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export default function MusicPage() {
  const [musicCompositions, setMusicCompositions] = useState<Music[]>([]);
  const [selectedMusic, setSelectedMusic] = useState<Music | null>(null);
  const [autoplay, setAutoplay] = useState(true);

  const handlePendingMusic = (prompt: string) => {
    const pendingMusic: Music = {
      id: nanoid(),
      prompt,
      audioBase64: '',
      createdAt: new Date(),
      status: 'loading',
    };
    setMusicCompositions((prev) => [pendingMusic, ...prev]);
    setSelectedMusic(pendingMusic);
    return pendingMusic.id;
  };

  const updatePendingMusic = (id: string, music: Music) => {
    setMusicCompositions((prev) =>
      prev.map((item) => (item.id === id ? { ...music, status: 'complete' as const } : item))
    );
    setSelectedMusic((current) =>
      current?.id === id ? { ...music, status: 'complete' as const } : current
    );
  };

  return (
    <div>
      <div className="container mx-auto">
        <div className="grid h-[600px] grid-cols-[1fr_auto_300px]">
          <div className="bg-card flex flex-col rounded-lg p-6">
            <h1 className="text-2xl font-bold">Music composition</h1>
            <div className="flex flex-1 flex-col justify-center">
              {selectedMusic ? (
                <div className="space-y-4">
                  {selectedMusic.status === 'complete' && (
                    <p className="text-muted-foreground text-sm">{selectedMusic.prompt}</p>
                  )}
                  {selectedMusic.status === 'loading' ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white" />
                    </div>
                  ) : selectedMusic.audioBase64 ? (
                    <AudioPlayer audioBase64={selectedMusic.audioBase64} autoplay={autoplay} />
                  ) : null}
                </div>
              ) : (
                <EmptyState />
              )}
            </div>
          </div>

          <Separator orientation="vertical" className="h-full" />

          <ScrollArea className="h-[600px] overflow-hidden rounded-tr-lg">
            <div className="flex items-center justify-between border-b p-3">
              <h2 className="font-semibold">Compositions</h2>
              <div className="flex items-center gap-2">
                <label htmlFor="autoplay" className="text-sm">
                  Autoplay
                </label>
                <Switch id="autoplay" checked={autoplay} onCheckedChange={setAutoplay} />
              </div>
            </div>
            <div>
              {musicCompositions.map((music) => (
                <Card
                  key={music.id}
                  className={cn(
                    'hover:bg-accent relative cursor-pointer rounded-none border-0 transition-colors',
                    selectedMusic?.id === music.id && 'bg-accent',
                    music.status === 'loading' &&
                      'cursor-not-allowed opacity-70 hover:bg-transparent'
                  )}
                  onClick={() => music.status === 'complete' && setSelectedMusic(music)}
                >
                  <CardContent className="px-3 py-3">
                    <p className="mb-1 max-w-[250px] truncate font-medium">{music.prompt}</p>
                    {music.status === 'loading' ? (
                      <div className="text-muted-foreground flex items-center gap-2 text-xs">
                        <div className="h-3 w-3 animate-spin rounded-full border-b-2 border-current" />
                        <span>Generating...</span>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-xs">
                        {formatDistanceToNow(music.createdAt, {
                          addSuffix: true,
                        })}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="mx-auto max-w-4xl">
          <MusicPromptBar
            onPendingMusic={handlePendingMusic}
            onUpdatePendingMusic={updatePendingMusic}
          />
        </div>
      </div>
    </div>
  );
}

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center gap-4">
    <Image
      src="/empty-folder.png"
      alt="Music composition placeholder"
      width={160}
      height={160}
      className="select-none"
      draggable={false}
    />
    <p className="text-muted-foreground font-medium">
      Select a composition to play or create a new one
    </p>
  </div>
);
