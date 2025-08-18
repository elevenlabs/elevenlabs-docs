'use client';

import { formatDistanceToNow } from 'date-fns';
import { SparklesIcon } from 'lucide-react';
import { nanoid } from 'nanoid';
import Image from 'next/image';
import { useState } from 'react';
import { toast } from 'sonner';

import { AudioPlayer } from '@/app/(examples)/text-to-speech/components/audio-player';
import { CompositionPlan } from '@/app/actions/create-composition-plan';
import { createMusic } from '@/app/actions/create-music';
import { CompositionPlanEditor } from '@/components/composition-plan-editor';
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
  const [currentPlan, setCurrentPlan] = useState<{
    prompt: string;
    plan: CompositionPlan;
    musicLength: number;
  } | null>(null);

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

  const handleCompositionPlan = (prompt: string, plan: CompositionPlan, musicLength: number) => {
    setCurrentPlan({ prompt, plan, musicLength });
    setSelectedMusic(null); // Clear any selected music to show the plan editor
  };

  const handleViewCompositionPlan = (music: Music) => {
    if (music.compositionPlan) {
      setCurrentPlan({
        prompt: music.prompt,
        plan: music.compositionPlan,
        musicLength: 30000, // Default to 30s, could be stored in music object
      });
      setSelectedMusic(null); // Clear selected music to show the plan editor
    }
  };

  const handleCompositionPlanUpdate = (updatedPlan: CompositionPlan) => {
    if (currentPlan) {
      setCurrentPlan({ ...currentPlan, plan: updatedPlan });
    }
  };

  const handleComposeFromPlan = async () => {
    if (!currentPlan) return;

    const pendingMusic: Music = {
      id: nanoid(),
      prompt: currentPlan.prompt,
      audioBase64: '',
      createdAt: new Date(),
      status: 'loading',
      compositionPlan: currentPlan.plan,
      useCompositionPlan: true,
    };

    setMusicCompositions((prev) => [pendingMusic, ...prev]);
    setSelectedMusic(pendingMusic);
    setCurrentPlan(null); // Clear the plan editor

    try {
      toast.info('Composing music from plan...');

      const result = await createMusic({
        compositionPlan: currentPlan.plan,
        musicLengthMs: currentPlan.musicLength,
      });

      if (result.ok) {
        const completedMusic: Music = {
          ...pendingMusic,
          audioBase64: result.value.audioBase64,
          status: 'complete',
          musicLengthMs: currentPlan.musicLength,
        };
        updatePendingMusic(pendingMusic.id, completedMusic);
        toast.success('Music composed successfully!');
      } else {
        toast.error(`Failed to compose music: ${result.error}`);
        // Remove the pending music on error
        setMusicCompositions((prev) => prev.filter((m) => m.id !== pendingMusic.id));
        setSelectedMusic(null);
      }
    } catch (error) {
      toast.error(`An unexpected error occurred: ${error}`);
      // Remove the pending music on error
      setMusicCompositions((prev) => prev.filter((m) => m.id !== pendingMusic.id));
      setSelectedMusic(null);
    }
  };

  return (
    <div>
      <div className="container mx-auto">
        <div className="grid h-[600px] grid-cols-[1fr_auto_300px]">
          <div className="bg-card flex flex-col overflow-hidden rounded-lg p-6">
            {!currentPlan && <h1 className="mb-4 text-2xl font-bold">Music composition</h1>}
            <div className={`flex flex-1 flex-col ${currentPlan ? '' : 'justify-center'} min-h-0`}>
              {currentPlan ? (
                <CompositionPlanEditor
                  plan={currentPlan.plan}
                  onPlanUpdate={handleCompositionPlanUpdate}
                  onCompose={handleComposeFromPlan}
                  prompt={currentPlan.prompt}
                />
              ) : selectedMusic ? (
                <div className="space-y-4">
                  {selectedMusic.status === 'complete' && (
                    <div className="space-y-2">
                      <p className="text-muted-foreground text-sm">{selectedMusic.prompt}</p>
                      {selectedMusic.compositionPlan && (
                        <button
                          onClick={() => handleViewCompositionPlan(selectedMusic)}
                          className="text-sm text-blue-400 underline underline-offset-2 transition-colors hover:text-blue-300"
                        >
                          View composition plan
                        </button>
                      )}
                    </div>
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
                    <div className="flex items-start justify-between gap-2">
                      <p className="mb-1 max-w-[200px] truncate font-medium">{music.prompt}</p>
                      {music.compositionPlan && (
                        <SparklesIcon className="h-4 w-4 flex-shrink-0 text-blue-400" />
                      )}
                    </div>
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
            onCompositionPlan={handleCompositionPlan}
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
