'use client';

import { CheckIcon, MicIcon, SpeechIcon } from 'lucide-react';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { toast } from 'sonner';

import { createTextToDialogue } from '@/app/actions/create-v3-speech';
import { getVoices } from '@/app/actions/manage-voices';
import { PromptBar, PromptControlsProps } from '@/components/prompt-bar/base';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TTSV3Input, TTS_MODELS, ttsV3Schema } from '@/lib/schemas';

export type TextToDialoguePromptBarProps = {
  onGenerateStart: (text: string) => string;
  onGenerateComplete: (id: string, text: string, audioUrl: string) => void;
};

export type TextToDialoguePromptBarRef = {
  setPrompt: (prompt: string) => void;
};

export const TextToDialoguePromptBar = forwardRef<
  TextToDialoguePromptBarRef,
  TextToDialoguePromptBarProps
>(({ onGenerateStart, onGenerateComplete }, ref) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [voices, setVoices] = useState<Array<{ voiceId: string; name: string }>>([]);
  const [generationTime, setGenerationTime] = useState<number | null>(null);
  const [formRef, setFormRef] = useState<any>(null);
  const [settings, setSettings] = useState<{
    voiceIds: string[];
    modelId: typeof TTS_MODELS.MULTILINGUAL | typeof TTS_MODELS.FLASH;
    stability: number;
    similarityBoost: number;
    style: number;
    speed: number;
    useSpeakerBoost: boolean;
  }>(DEFAULT_SETTINGS);

  useImperativeHandle(ref, () => ({
    setPrompt: (prompt: string) => {
      if (formRef) {
        formRef.setValue('prompt', prompt);
      }
    },
  }));

  useEffect(() => {
    async function loadVoices() {
      try {
        const result = await getVoices();
        if (result.ok) {
          const voiceList = result.value.voices.map((v) => ({
            voiceId: v.voiceId,
            name: v.name ?? 'Unknown Voice',
          }));
          setVoices(voiceList);
        }
      } catch (error) {
        toast.error('Error loading voices');
      } finally {
        setIsLoading(false);
      }
    }

    loadVoices();
  }, []);

  const getVoiceName = (voiceId: string): string => {
    const voice = voices.find((v) => v.voiceId === voiceId);
    return voice ? voice.name : 'Unknown Voice';
  };

  const getSelectedVoicesDisplay = (): string => {
    if (settings.voiceIds.length === 0) return 'Select Voices';
    if (settings.voiceIds.length === 1) return getVoiceName(settings.voiceIds[0]);
    return `${settings.voiceIds.length} voices selected`;
  };

  const updateSetting = <K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const toggleVoiceSelection = (voiceId: string) => {
    setSettings((prev) => ({
      ...prev,
      voiceIds: prev.voiceIds.includes(voiceId)
        ? prev.voiceIds.filter((id) => id !== voiceId)
        : [...prev.voiceIds, voiceId],
    }));
  };

  const handleSubmit = async (data: { prompt: string }) => {
    if (settings.voiceIds.length === 0) {
      toast.error('Please select at least one voice to generate dialogue');
      return;
    }

    if (!data.prompt.trim()) {
      toast.error('Please enter a prompt for the dialogue');
      return;
    }

    try {
      setIsGenerating(true);
      setGenerationTime(null);

      const startTime = performance.now();

      // Use the actual prompt text for the generation
      const pendingId = onGenerateStart(data.prompt);

      // Call the text-to-dialogue action with the user's prompt and selected voices
      const result = await createTextToDialogue(data.prompt, settings.voiceIds);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      // Convert the stream to a blob and create an audio URL
      const stream = result.value;
      const chunks: Uint8Array[] = [];
      const reader = stream.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      // Combine all chunks into a single Uint8Array
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const audioData = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        audioData.set(chunk, offset);
        offset += chunk.length;
      }

      // Create blob and URL
      const audioBlob = new Blob([audioData], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);

      const elapsed = performance.now() - startTime;
      setGenerationTime(elapsed);

      // Pass the complete URL to the callback
      onGenerateComplete(pendingId, data.prompt, audioUrl);
      toast.success('Generation complete');
    } catch (err) {
      toast.error(`An unexpected error occurred: ${err}`);
      setGenerationTime(null);
    } finally {
      setIsGenerating(false);
    }
  };

  function syncFormWithSettings(form: PromptControlsProps<TTSV3Input>['form']) {
    if (!isLoading) {
      if (settings.voiceIds) form.setValue('voiceIds', settings.voiceIds);
    }
  }

  const renderControls = ({ form }: PromptControlsProps<TTSV3Input>) => {
    const selectedVoicesDisplay = getSelectedVoicesDisplay();

    // Use useEffect to capture the form reference instead of setting it during render
    useEffect(() => {
      if (!formRef && form) {
        setFormRef(form);
      }
    }, [form, formRef]);

    if (!isLoading) {
      syncFormWithSettings(form);
    }

    if (isLoading) {
      return (
        <div className="flex flex-wrap gap-1.5">
          <Button
            size="icon"
            variant="ghost"
            className="flex h-9 min-w-32 items-center gap-1.5 rounded-full bg-white/10 px-3"
            disabled
          >
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span className="ml-2">Loading...</span>
          </Button>
        </div>
      );
    }

    return (
      <div className="flex w-full flex-col gap-2">
        <div className="flex flex-wrap gap-1.5">
          {/* Voice Selection */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="flex h-9 min-w-60 items-center gap-1.5 rounded-full bg-white/10 px-3 hover:bg-white/20"
              >
                <MicIcon className="h-[18px] w-[18px]" />
                <span className="max-w-50 mr-2 truncate">{selectedVoicesDisplay}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-[500px] overflow-y-auto border border-white/10 bg-[#2B2B2B] text-white">
              <DropdownMenuLabel>Select voices</DropdownMenuLabel>

              {voices.length > 0 && (
                <>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuLabel>Recent Voices</DropdownMenuLabel>
                  <DropdownMenuGroup className="flex flex-col gap-1">
                    {voices.map((voice) => (
                      <DropdownMenuItem
                        key={voice.voiceId}
                        className={`flex cursor-pointer items-center gap-2 focus:bg-white/10 ${
                          settings.voiceIds.includes(voice.voiceId) ? 'bg-white/20' : ''
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          toggleVoiceSelection(voice.voiceId);
                        }}
                      >
                        <div className="flex h-4 w-4 items-center justify-center">
                          {settings.voiceIds.includes(voice.voiceId) ? (
                            <CheckIcon className="h-4 w-4" />
                          ) : (
                            <SpeechIcon className="h-4 w-4" />
                          )}
                        </div>
                        <span>{voice.name}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  const defaultValues = {
    prompt: '',
    voiceIds: settings.voiceIds,
  };

  return (
    <PromptBar
      schema={ttsV3Schema}
      defaultValues={defaultValues}
      promptFieldName="prompt"
      placeholder="Describe the audio you want to generate..."
      submitTooltip="Generate dialogue"
      leftControls={renderControls}
      onSubmit={handleSubmit}
      isLoading={isGenerating}
    />
  );
});

const DEFAULT_SETTINGS = {
  voiceIds: [],
  modelId: TTS_MODELS.MULTILINGUAL,
  stability: 0.5,
  similarityBoost: 0.75,
  style: 0,
  speed: 1.0,
  useSpeakerBoost: false,
};
