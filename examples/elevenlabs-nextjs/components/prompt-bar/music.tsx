'use client';

import { ClockIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { createMusic, CreateMusicRequest } from '@/app/actions/create-music';
import { PromptBar, PromptControlsProps } from '@/components/prompt-bar/base';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MusicInput, musicSchema } from '@/lib/schemas';

export type MusicPromptProps = {
  onPendingMusic: (prompt: string) => string;
  onUpdatePendingMusic: (id: string, music: Music) => void;
};

export function MusicPromptBar({ onPendingMusic, onUpdatePendingMusic }: MusicPromptProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = async (data: MusicInput) => {
    try {
      setIsGenerating(true);

      const pendingId = onPendingMusic(data.prompt);

      const request: CreateMusicRequest = {
        prompt: data.prompt,
        musicLengthMs: data.musicLength,
      };

      const result = await createMusic(request);

      if (result.ok) {
        const music: Music = {
          id: pendingId,
          prompt: data.prompt,
          audioBase64: result.value.audioBase64,
          createdAt: new Date(),
          status: 'complete',
        };
        onUpdatePendingMusic(pendingId, music);
        toast.success('Generated music composition');
        return;
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      toast.error(`An unexpected error occurred: ${err}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderLeftControls = ({ form }: PromptControlsProps<MusicInput>) => {
    const musicLength = form.watch('musicLength');

    return (
      <div className="flex flex-wrap gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="flex h-9 w-9 min-w-[80px] items-center gap-1.5 rounded-full bg-white/10 p-0 hover:bg-white/20"
            >
              <ClockIcon className="h-[18px] w-[18px]" />
              <span className="mr-2">{(musicLength / 1000).toFixed(0)}s</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="border border-white/10 bg-[#2B2B2B] text-white">
            <DropdownMenuLabel>Duration</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuRadioGroup
              value={String(musicLength)}
              onValueChange={(value) =>
                form.setValue('musicLength', Number.parseInt(value), {
                  shouldDirty: true,
                  shouldTouch: true,
                })
              }
            >
              <DropdownMenuRadioItem className="focus:bg-white/10" value="10000">
                10s
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem className="focus:bg-white/10" value="30000">
                30s
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem className="focus:bg-white/10" value="60000">
                1m
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem className="focus:bg-white/10" value="120000">
                2m
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem className="focus:bg-white/10" value="180000">
                3m
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem className="focus:bg-white/10" value="300000">
                5m
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  return (
    <PromptBar
      schema={musicSchema}
      defaultValues={{
        prompt: '',
        musicLength: 30000,
      }}
      promptFieldName="prompt"
      placeholder="Describe the music you want to create..."
      submitTooltip="Create music composition"
      leftControls={renderLeftControls}
      onSubmit={handleSubmit}
      isLoading={isGenerating}
    />
  );
}

export type Music = {
  id: string;
  prompt: string;
  audioBase64: string;
  createdAt: Date;
  status: 'loading' | 'complete';
};
