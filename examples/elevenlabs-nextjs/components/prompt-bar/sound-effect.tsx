'use client';

import { ClockIcon, DiamondIcon, HelpCircleIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { generateSoundEffect } from '@/app/actions';
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
import { Slider } from '@/components/ui/slider';
import { SoundEffectInput as SoundEffectInputType, soundEffectSchema } from '@/lib/schemas';
import type { GeneratedSoundEffect } from '@/types';

export type SoundEffectPromptProps = {
  onPendingEffect: (prompt: string) => string;
  onUpdatePendingEffect: (id: string, effect: GeneratedSoundEffect) => void;
};

export function SoundEffectPrompt({
  onPendingEffect,
  onUpdatePendingEffect,
}: SoundEffectPromptProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = async (data: SoundEffectInputType) => {
    try {
      setIsGenerating(true);

      const duration = data.duration_seconds === 'auto' ? 'auto' : data.duration_seconds;
      const result = await generateSoundEffect(data.text, duration, data.prompt_influence);

      if (result.ok) {
        const pendingId = onPendingEffect(data.text);
        const effect: GeneratedSoundEffect = {
          id: pendingId,
          prompt: data.text,
          audioBase64: result.value.audioBase64,
          createdAt: new Date(),
          status: 'complete',
        };
        onUpdatePendingEffect(pendingId, effect);
        toast.success('Generated sound effect');
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

  // Render the left controls for the input
  const renderLeftControls = ({ form }: PromptControlsProps<SoundEffectInputType>) => {
    // Use watch to properly subscribe to form value changes
    const duration = form.watch('duration_seconds');
    const promptInfluence = form.watch('prompt_influence');

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
              <span className="mr-2">{duration === 'auto' ? 'Auto' : `${duration}s`}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="border border-white/10 bg-[#2B2B2B] text-white">
            <DropdownMenuLabel>Duration</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuRadioGroup
              value={String(duration)}
              onValueChange={(value) =>
                form.setValue('duration_seconds', value === 'auto' ? 'auto' : parseFloat(value), {
                  shouldDirty: true,
                  shouldTouch: true,
                })
              }
            >
              <DropdownMenuRadioItem className="focus:bg-white/10" value="auto">
                Automatic
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem className="focus:bg-white/10" value="0.5">
                0.5s
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem className="focus:bg-white/10" value="1">
                1s
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem className="focus:bg-white/10" value="2">
                2s
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem className="focus:bg-white/10" value="5">
                5s
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem className="focus:bg-white/10" value="10">
                10s
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem className="focus:bg-white/10" value="22">
                22s
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="flex h-9 w-9 min-w-[80px] items-center gap-1.5 rounded-full bg-white/10 p-0 hover:bg-white/20"
            >
              <DiamondIcon className="h-[18px] w-[18px]" />
              <span className="mr-2">{(promptInfluence * 100).toFixed(0)}%</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 border border-white/10 bg-[#2B2B2B] text-white">
            <DropdownMenuLabel>Prompt Influence</DropdownMenuLabel>
            <div className="px-4 py-3">
              <p className="text-muted-foreground mb-4 text-sm">
                Slide to balance between creativity and prompt adherence
              </p>
              <Slider
                value={[promptInfluence]}
                onValueChange={(values) =>
                  form.setValue('prompt_influence', values[0], {
                    shouldDirty: true,
                    shouldTouch: true,
                  })
                }
                max={1}
                min={0}
                step={0.01}
                className="[&>.relative>.bg-primary]:bg-white"
              />
              <div className="text-muted-foreground mt-2 flex justify-between text-xs">
                <span>More Creative</span>
                <span>Follow Prompt</span>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          size="icon"
          variant="ghost"
          className="h-[36px] w-[36px] rounded-full border border-white/10 bg-transparent p-1.5 text-white/50 hover:bg-white/20 hover:text-white"
        >
          <HelpCircleIcon className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <PromptBar
      schema={soundEffectSchema}
      defaultValues={{
        text: '',
        duration_seconds: 'auto',
        prompt_influence: 0.3,
      }}
      promptFieldName="text"
      placeholder="Describe your sound effect..."
      submitTooltip="Create sound effect"
      leftControls={renderLeftControls}
      onSubmit={handleSubmit}
      isLoading={isGenerating}
    />
  );
}
