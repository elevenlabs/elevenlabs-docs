'use client';

import { PlusIcon, TrashIcon, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { createDialogue } from '@/app/actions/create-dialogue';
import { getVoices } from '@/app/actions/manage-voices';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogueFormInput, TTS_MODELS } from '@/lib/schemas';

export type TextToDialoguePromptProps = {
  onGenerateStart: () => void;
  onGenerateComplete: (id: string, audioUrl: string) => void;
};

export function TextToDialoguePromptBar({
  onGenerateStart,
  onGenerateComplete,
}: TextToDialoguePromptProps) {
  const [, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [voices, setVoices] = useState<Array<{ voiceId: string; name: string }>>([]);
  const [generationTime, setGenerationTime] = useState<number | null>(null);
  const [settings, setSettings] = useState<{
    modelId: typeof TTS_MODELS.V3 | typeof TTS_MODELS.MULTILINGUAL | typeof TTS_MODELS.FLASH;
  }>({
    modelId: TTS_MODELS.V3,
  });

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
        } else {
          setVoices(FEATURED_VOICES.map((v) => ({ voiceId: v.id, name: v.name })));
        }
      } catch (error) {
        console.error('Error loading voices:', error);
        setVoices(FEATURED_VOICES.map((v) => ({ voiceId: v.id, name: v.name })));
      } finally {
        setIsLoading(false);
      }
    }

    loadVoices();
  }, []);

  const getVoiceName = (voiceId: string): string => {
    const voice = voices.find((v) => v.voiceId === voiceId);
    if (voice) return voice.name;

    const featuredVoice = FEATURED_VOICES.find((v) => v.id === voiceId);
    if (featuredVoice) return featuredVoice.name;

    return 'Select Voice';
  };

  const updateSetting = <K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleGenerate = async (data: DialogueFormInput) => {
    if (isGenerating) return;

    setIsGenerating(true);
    setGenerationTime(null);
    onGenerateStart();

    try {
      const result = await createDialogue({
        inputs: data.inputs,
        modelId: settings.modelId,
      });

      if (!result.ok) {
        throw new Error(result.error);
      }

      const { audioBase64, processingTimeMs } = result.value;
      setGenerationTime(processingTimeMs);

      const id = `dialogue-${Date.now()}`;
      onGenerateComplete(id, audioBase64);

      toast.success(`Dialogue generated in ${Math.round(processingTimeMs)}ms`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const [dialogueInputs, setDialogueInputs] = useState([
    { text: '', voiceId: FEATURED_VOICES[0].id },
    { text: '', voiceId: FEATURED_VOICES[1].id },
  ]);

  const renderControls = () => {
    const inputs = dialogueInputs;

    const addDialogueInput = () => {
      setDialogueInputs((prev) => [...prev, { text: '', voiceId: FEATURED_VOICES[0].id }]);
    };

    const removeDialogueInput = (index: number) => {
      setDialogueInputs((prev) => prev.filter((_, i) => i !== index));
    };

    const updateDialogueInput = (index: number, field: 'text' | 'voiceId', value: string) => {
      setDialogueInputs((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });
    };

    return (
      <div className="flex flex-col gap-4">
        {/* Model Selection */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="justify-start border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                <Users className="mr-2 h-4 w-4" />
                {TTS_MODEL_INFO[settings.modelId].name}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 border-white/20 bg-black/90 text-white backdrop-blur-sm">
              <DropdownMenuLabel className="text-white/70">Model</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuRadioGroup
                value={settings.modelId}
                onValueChange={(value) =>
                  updateSetting(
                    'modelId',
                    value as
                      | typeof TTS_MODELS.V3
                      | typeof TTS_MODELS.MULTILINGUAL
                      | typeof TTS_MODELS.FLASH
                  )
                }
              >
                {Object.entries(TTS_MODEL_INFO).map(([modelId, info]) => (
                  <DropdownMenuRadioItem
                    key={modelId}
                    className="focus:bg-white/10 data-[state=checked]:bg-white/20"
                    value={modelId}
                  >
                    <div className="flex flex-col">
                      <span>{info.name}</span>
                      <span className="text-muted-foreground text-xs">{info.description}</span>
                    </div>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {generationTime && (
            <div className="text-muted-foreground text-sm">
              Generated in {Math.round(generationTime)}ms
            </div>
          )}
        </div>

        {/* Dialogue Inputs */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-white/90">Dialogue Lines</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addDialogueInput}
              className="border-white/20 bg-white/10 text-white hover:bg-white/20"
            >
              <PlusIcon className="mr-1 h-3 w-3" />
              Add Line
            </Button>
          </div>

          {inputs.map((input, index) => (
            <div
              key={index}
              className="flex gap-2 rounded-lg border border-white/20 bg-white/5 p-3"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-white/70">Speaker {index + 1}</Label>
                  {inputs.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDialogueInput(index)}
                      className="h-6 w-6 p-0 text-white/50 hover:bg-white/10 hover:text-white"
                    >
                      <TrashIcon className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start border-white/20 bg-white/10 text-white hover:bg-white/20"
                      >
                        {getVoiceName(input.voiceId || FEATURED_VOICES[0].id)}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 border-white/20 bg-black/90 text-white backdrop-blur-sm">
                      <DropdownMenuLabel className="text-white/70">Voice</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuGroup>
                        {voices.map((voice) => (
                          <DropdownMenuRadioItem
                            key={voice.voiceId}
                            value={voice.voiceId}
                            className="focus:bg-white/10"
                            onClick={() => updateDialogueInput(index, 'voiceId', voice.voiceId)}
                          >
                            {voice.name}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Input
                    placeholder="Enter dialogue text..."
                    value={input.text || ''}
                    onChange={(e) => updateDialogueInput(index, 'text', e.target.value)}
                    className="border-white/20 bg-white/10 text-white placeholder:text-white/50"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-[24px] border border-white/10 bg-[#2B2B2B]/70 p-4 backdrop-blur-xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const inputs = dialogueInputs.filter((input) => input.text.trim() && input.voiceId);
          if (inputs.length > 0) {
            handleGenerate({ inputs, modelId: settings.modelId });
          }
        }}
      >
        {renderControls()}

        <div className="mt-4 flex justify-end">
          <Button
            type="submit"
            disabled={isGenerating || dialogueInputs.every((input) => !input.text.trim())}
            className="bg-white text-black hover:bg-white/80"
          >
            {isGenerating ? 'Generating...' : 'Generate Dialogue'}
          </Button>
        </div>
      </form>
    </div>
  );
}

const FEATURED_VOICES = [
  { id: 'EkK5I93UQWFDigLMpZcX', name: 'James', accent: 'American' },
  { id: 'RILOU7YmBhvwJGDGjNmP', name: 'Jane', accent: 'American' },
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', accent: 'American' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', accent: 'American' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Adam', accent: 'American' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Nicole', accent: 'American' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', accent: 'American' },
  { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', accent: 'American' },
  { id: 'jBpfuIE2acCO8z3wKNLl', name: 'Callum', accent: 'British' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Charlotte', accent: 'British' },
];

const TTS_MODEL_INFO = {
  [TTS_MODELS.V3]: {
    name: 'Eleven V3',
    description: 'Latest model with improved quality and performance',
  },
  [TTS_MODELS.MULTILINGUAL]: {
    name: 'High Quality',
    description: 'Superior quality, slower generation',
  },
  [TTS_MODELS.FLASH]: {
    name: 'Flash',
    description: 'Faster generation at 50% off, good quality',
  },
};
