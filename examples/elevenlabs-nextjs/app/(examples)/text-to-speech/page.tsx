'use client';

import { formatDistanceToNow } from 'date-fns';
import { nanoid } from 'nanoid';
import Image from 'next/image';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { AudioPlayer } from '@/app/(examples)/text-to-speech/components/audio-player';
import { TextToSpeechPromptBar } from '@/components/prompt-bar/text-to-speech';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export default function TextToSpeechPage() {
  const [speeches, setSpeeches] = useState<GeneratedSpeech[]>([]);
  const [selectedSpeech, setSelectedSpeech] = useState<GeneratedSpeech | null>(null);
  const [autoplay, setAutoplay] = useState(true);

  const handleGenerateStart = useCallback((text: string) => {
    const pendingSpeech: GeneratedSpeech = {
      id: nanoid(),
      text,
      audioBase64: '',
      createdAt: new Date(),
      status: 'loading',
    };

    setSpeeches((prev) => [pendingSpeech, ...prev]);
    setSelectedSpeech(pendingSpeech);
    return pendingSpeech.id;
  }, []);

  const handleGenerateComplete = useCallback((id: string, text: string, audioUrl: string) => {
    // Make sure we have a valid URL
    if (!audioUrl) {
      toast.error('Failed to generate speech audio');
      setSpeeches((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: 'error' as const } : item))
      );
      return;
    }

    setSpeeches((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              text,
              audioBase64: audioUrl,
              status: 'complete' as const,
            }
          : item
      )
    );

    setSelectedSpeech((current) =>
      current?.id === id
        ? {
            ...current,
            text,
            audioBase64: audioUrl,
            status: 'complete' as const,
          }
        : current
    );
  }, []);

  return (
    <div>
      <div className="container mx-auto">
        <div className="grid h-[600px] grid-cols-[1fr_auto_300px]">
          <div className="bg-card flex flex-col rounded-lg p-6">
            <h1 className="text-2xl font-bold">Text to speech</h1>
            <div className="flex flex-1 flex-col justify-center">
              {selectedSpeech ? (
                <div className="space-y-4">
                  {selectedSpeech.status === 'complete' && (
                    <p className="text-muted-foreground text-sm">{selectedSpeech.text}</p>
                  )}
                  {selectedSpeech.status === 'loading' ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white" />
                    </div>
                  ) : selectedSpeech.audioBase64 ? (
                    <AudioPlayer audioBase64={selectedSpeech.audioBase64} autoplay={autoplay} />
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
              <h2 className="font-semibold">Generations</h2>
              <div className="flex items-center gap-2">
                <label htmlFor="autoplay" className="text-sm">
                  Autoplay
                </label>
                <Switch id="autoplay" checked={autoplay} onCheckedChange={setAutoplay} />
              </div>
            </div>
            <div>
              {speeches.map((speech) => (
                <Card
                  key={speech.id}
                  className={cn(
                    'hover:bg-accent relative cursor-pointer rounded-none border-0 transition-colors',
                    selectedSpeech?.id === speech.id && 'bg-accent',
                    speech.status === 'loading' &&
                      'cursor-not-allowed opacity-70 hover:bg-transparent'
                  )}
                  onClick={() => speech.status === 'complete' && setSelectedSpeech(speech)}
                >
                  <CardContent className="px-3 py-3">
                    <p className="mb-1 max-w-[250px] truncate font-medium">{speech.text}</p>
                    {speech.status === 'loading' ? (
                      <div className="text-muted-foreground flex items-center gap-2 text-xs">
                        <div className="h-3 w-3 animate-spin rounded-full border-b-2 border-current" />
                        <span>Generating...</span>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-xs">
                        {formatDistanceToNow(speech.createdAt, {
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
          <TextToSpeechPromptBar
            onGenerateStart={handleGenerateStart}
            onGenerateComplete={handleGenerateComplete}
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
      alt="Speech placeholder"
      width={160}
      height={160}
      className="select-none"
      draggable={false}
    />
    <p className="text-muted-foreground font-medium">Select a speech to play or create a new one</p>
  </div>
);

interface GeneratedSpeech {
  id: string;
  text: string;
  audioBase64: string;
  createdAt: Date;
  status: 'loading' | 'complete' | 'error';
}
