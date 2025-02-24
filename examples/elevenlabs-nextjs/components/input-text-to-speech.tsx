'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowUpIcon, ClockIcon, DiamondIcon, HelpCircleIcon, Loader2Icon } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { generateTextToSpeech } from '@/app/actions';
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
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TextToSpeechInput, textToSpeechSchema } from '@/lib/schemas';
import { Models } from '@/lib/schemas';
import type { GeneratedSoundEffect } from '@/types';

export function InputTextToSpeech() {
  const form = useForm<TextToSpeechInput>({
    resolver: zodResolver(textToSpeechSchema),
    defaultValues: {
      text: 'This is a test',
      model_id: Models.Multilingual,
    },
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const generate = async (data: TextToSpeechInput) => {
    try {
      setIsGenerating(true);

      const result = await generateTextToSpeech(data.text, data.model_id, 'JBFqnCBsd6RMkjVDRZzb');

      if (result.ok) {
        toast.success('Generated sound effect');
        form.reset();
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      toast.error(`An unexpected error occurred: ${err}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const formData = form.getValues();
      if (formData.text.trim() && !isGenerating) {
        form.handleSubmit(generate)();
      }
    }
  };

  return (
    <div>
      <form onSubmit={form.handleSubmit(generate)}>
        <div className="relative rounded-[24px] border border-white/10 bg-[#2B2B2B]/70 p-2 backdrop-blur-xl">
          <Textarea
            {...form.register('text', {
              onChange: (e) => {
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              },
            })}
            disabled={isGenerating}
            className="placeholder:text-token-text-secondary scrollbar-hide flex max-h-[80vh] w-full rounded-md border-0 bg-transparent px-3 pb-4 pt-3 text-sm focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 max-md:flex-1"
            placeholder="Describe your sound effect..."
            rows={1}
            style={{
              overflowY: 'auto',
              overflowX: 'hidden',
              overflowWrap: 'break-word',
              resize: 'none',
              minHeight: '48px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              scrollbarColor: 'transparent transparent',
            }}
            onKeyDown={handleKeyDown}
          />

          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              <div className="flex flex-wrap gap-1.5">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="flex h-9 w-9 min-w-[80px] items-center gap-1.5 rounded-full bg-white/10 p-0 hover:bg-white/20"
                    >
                      <ClockIcon className="h-[18px] w-[18px]" />
                      <span className="mr-2">
                        {form.watch('duration_seconds') === 'auto'
                          ? 'Auto'
                          : `${form.watch('duration_seconds')}s`}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Duration</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup
                      value={String(form.watch('duration_seconds'))}
                      onValueChange={(value) =>
                        form.setValue(
                          'duration_seconds',
                          value === 'auto' ? 'auto' : parseFloat(value)
                        )
                      }
                    >
                      <DropdownMenuRadioItem value="auto">Automatic</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="0.5">0.5s</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="1">1s</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="2">2s</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="5">5s</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="10">10s</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="22">22s</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  {/* <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="flex h-9 w-9 min-w-[80px] items-center gap-1.5 rounded-full bg-white/10 p-0 hover:bg-white/20"
                    >
                      <DiamondIcon className="h-[18px] w-[18px]" />
                      <span className="mr-2">
                        {(form.watch('prompt_influence') * 100).toFixed(0)}%
                      </span>
                    </Button>
                  </DropdownMenuTrigger> */}
                  {/* <DropdownMenuContent className="w-80">
                    <DropdownMenuLabel>Prompt Influence</DropdownMenuLabel>
                    <div className="px-4 py-3">
                      <p className="text-muted-foreground mb-4 text-sm">
                        Slide to balance between creativity and prompt adherence
                      </p>
                      <Slider
                        value={[form.watch('prompt_influence')]}
                        onValueChange={(values) => form.setValue('prompt_influence', values[0])}
                        max={1}
                        min={0}
                        step={0.01}
                      />
                      <div className="text-muted-foreground mt-2 flex justify-between text-xs">
                        <span>More Creative</span>
                        <span>Follow Prompt</span>
                      </div>
                    </div>
                  </DropdownMenuContent> */}
                </DropdownMenu>

                <Button
                  size="icon"
                  variant="ghost"
                  className="h-[36px] w-[36px] rounded-full border border-white/10 bg-transparent p-1.5 text-white/50 hover:bg-white/20 hover:text-white"
                >
                  <HelpCircleIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-1.5">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      disabled={!form.watch('text').trim() || isGenerating}
                      className="h-[36px] w-[36px] rounded-full bg-white p-1.5 text-zinc-900 hover:bg-white/80"
                      type="submit"
                    >
                      {isGenerating ? (
                        <Loader2Icon className="h-6 w-6 animate-spin" />
                      ) : (
                        <ArrowUpIcon className="h-6 w-6" />
                      )}
                      <span className="sr-only">Convert</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Generate sound (Enter)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
