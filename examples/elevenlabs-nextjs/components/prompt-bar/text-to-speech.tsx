'use client';

import { TextToSpeechRequest } from 'elevenlabs/api';
import { BoltIcon, MicIcon, SparklesIcon, SpeakerIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { getVoices } from '@/app/actions/manage-voices';
import { PromptBar, PromptControlsProps } from '@/components/prompt-bar/base';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useSpeech } from '@/hooks/use-speech';
import { TtsInput, ttsSchema, TTS_MODELS } from '@/lib/schemas';

export type TextToSpeechPromptProps = {
  onGenerateStart: (text: string) => string;
  onGenerateComplete: (id: string, text: string, audioUrl: string) => void;
};

export function TextToSpeechPromptBar({
  onGenerateStart,
  onGenerateComplete,
}: TextToSpeechPromptProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [voices, setVoices] = useState<Array<{ voice_id: string; name: string }>>([]);
  const [generationTime, setGenerationTime] = useState<number | null>(null);
  const [settings, setSettings] = useState<{
    voice_id: string;
    model_id: typeof TTS_MODELS.MULTILINGUAL | typeof TTS_MODELS.FLASH;
    stability: number;
    similarity_boost: number;
    style: number;
    speed: number;
    use_speaker_boost: boolean;
  }>(DEFAULT_SETTINGS);

  const {
    speak,
    isLoading: isSpeaking,
    error,
  } = useSpeech({
    onError: (errorMessage) => toast.error(errorMessage),
  });

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    async function loadVoices() {
      try {
        const result = await getVoices();
        if (result.ok) {
          const voiceList = result.value.voices.map((v) => ({
            voice_id: v.voice_id,
            name: v.name ?? 'Unknown Voice',
          }));
          setVoices(voiceList);
        } else {
          setVoices(FEATURED_VOICES.map((v) => ({ voice_id: v.id, name: v.name })));
        }
      } catch (error) {
        console.error('Error loading voices:', error);
        setVoices(FEATURED_VOICES.map((v) => ({ voice_id: v.id, name: v.name })));
      } finally {
        setIsLoading(false);
      }
    }

    loadVoices();
  }, []);

  const getVoiceName = (voiceId: string): string => {
    const voice = voices.find((v) => v.voice_id === voiceId);
    if (voice) return voice.name;

    const featuredVoice = FEATURED_VOICES.find((v) => v.id === voiceId);
    if (featuredVoice) return featuredVoice.name;

    return 'Select Voice';
  };

  const updateSetting = <K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (data: { text: string }) => {
    try {
      setIsGenerating(true);
      setGenerationTime(null);

      const startTime = performance.now();

      const requestData: TextToSpeechRequest = {
        text: data.text,
        model_id: settings.model_id,
        voice_settings: {
          stability: settings.stability,
          similarity_boost: settings.similarity_boost,
          style: settings.style,
          speed: settings.speed,
          use_speaker_boost: settings.use_speaker_boost,
        },
      };

      const pendingId = onGenerateStart(data.text);

      const audioUrl = await speak(settings.voice_id, requestData);

      const elapsed = performance.now() - startTime;
      setGenerationTime(elapsed);

      if (audioUrl) {
        // Pass the complete URL to the callback
        onGenerateComplete(pendingId, data.text, audioUrl);
        toast.success('Generated speech');
      }
    } catch (err) {
      toast.error(`An unexpected error occurred: ${err}`);
      setGenerationTime(null);
    } finally {
      setIsGenerating(false);
    }
  };

  function syncFormWithSettings(form: PromptControlsProps<TtsInput>['form']) {
    if (!isLoading) {
      if (settings.voice_id) form.setValue('voice_id', settings.voice_id);
      if (settings.model_id) form.setValue('model_id', settings.model_id);
      if (settings.stability !== undefined) form.setValue('stability', settings.stability);
      if (settings.similarity_boost !== undefined)
        form.setValue('similarity_boost', settings.similarity_boost);
      if (settings.style !== undefined) form.setValue('style', settings.style);
      if (settings.speed !== undefined) form.setValue('speed', settings.speed);
      if (settings.use_speaker_boost !== undefined)
        form.setValue('use_speaker_boost', settings.use_speaker_boost);
    }
  }

  const renderControls = ({ form }: PromptControlsProps<TtsInput>) => {
    const modelInfo = TTS_MODEL_INFO[settings.model_id as keyof typeof TTS_MODEL_INFO];
    const voiceName = getVoiceName(settings.voice_id);

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
                className="flex h-9 min-w-32 items-center gap-1.5 rounded-full bg-white/10 px-3 hover:bg-white/20"
              >
                <MicIcon className="h-[18px] w-[18px]" />
                <span className="mr-2 max-w-[120px] truncate">{voiceName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-[400px] overflow-y-auto border border-white/10 bg-[#2B2B2B] text-white">
              <DropdownMenuLabel>Featured Voices</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuGroup>
                {FEATURED_VOICES.map((voice) => (
                  <DropdownMenuItem
                    key={voice.id}
                    className={`flex cursor-pointer items-center gap-2 focus:bg-white/10 ${
                      settings.voice_id === voice.id ? 'bg-white/20' : ''
                    }`}
                    onClick={() => updateSetting('voice_id', voice.id)}
                  >
                    <SpeakerIcon className="h-4 w-4" />
                    <span>{voice.name}</span>
                    <span className="text-muted-foreground ml-auto text-xs">{voice.accent}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>

              {voices.length > FEATURED_VOICES.length && (
                <>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuLabel>All Voices</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuGroup>
                    {voices
                      .filter((voice) => !FEATURED_VOICES.some((f) => f.id === voice.voice_id))
                      .map((voice) => (
                        <DropdownMenuItem
                          key={voice.voice_id}
                          className={`flex cursor-pointer items-center gap-2 focus:bg-white/10 ${
                            settings.voice_id === voice.voice_id ? 'bg-white/20' : ''
                          }`}
                          onClick={() => updateSetting('voice_id', voice.voice_id)}
                        >
                          <SpeakerIcon className="h-4 w-4" />
                          <span>{voice.name}</span>
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuGroup>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="flex h-9 min-w-32 items-center gap-1.5 rounded-full bg-white/10 px-3 hover:bg-white/20"
              >
                {settings.model_id === TTS_MODELS.FLASH ? (
                  <BoltIcon className="h-[18px] w-[18px] text-yellow-400" />
                ) : (
                  <SparklesIcon className="h-[18px] w-[18px] text-purple-400" />
                )}
                <span className="mr-2">{modelInfo.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="border border-white/10 bg-[#2B2B2B] text-white">
              <DropdownMenuLabel>Model Selection</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuRadioGroup
                value={settings.model_id}
                onValueChange={(value) =>
                  updateSetting(
                    'model_id',
                    value as typeof TTS_MODELS.MULTILINGUAL | typeof TTS_MODELS.FLASH
                  )
                }
              >
                <DropdownMenuRadioItem
                  className="focus:bg-white/10 data-[state=checked]:bg-white/20"
                  value={TTS_MODELS.MULTILINGUAL}
                >
                  <div className="flex items-center gap-2">
                    <SparklesIcon className="h-4 w-4 text-purple-400" />
                    <div className="flex flex-col">
                      <span>{TTS_MODEL_INFO[TTS_MODELS.MULTILINGUAL].name}</span>
                      <span className="text-muted-foreground text-xs">
                        {TTS_MODEL_INFO[TTS_MODELS.MULTILINGUAL].description}
                      </span>
                    </div>
                  </div>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem
                  className="focus:bg-white/10 data-[state=checked]:bg-white/20"
                  value={TTS_MODELS.FLASH}
                >
                  <div className="flex items-center gap-2">
                    <BoltIcon className="h-4 w-4 text-yellow-400" />
                    <div className="flex flex-col">
                      <span>{TTS_MODEL_INFO[TTS_MODELS.FLASH].name}</span>
                      <span className="text-muted-foreground text-xs">
                        {TTS_MODEL_INFO[TTS_MODELS.FLASH].description}
                      </span>
                    </div>
                  </div>
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-[36px] w-[36px] rounded-full border border-white/10 bg-transparent p-1.5 text-white/50 hover:bg-white/20 hover:text-white"
              >
                <SpeakerIcon className="h-4 w-4" />
                <span className="sr-only">Settings</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 border border-white/10 bg-[#2B2B2B] text-white">
              <DropdownMenuLabel>Voice Settings</DropdownMenuLabel>
              <div className="p-4">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Stability: {(settings.stability * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Slider
                    value={[settings.stability]}
                    onValueChange={(values) => updateSetting('stability', values[0])}
                    max={1}
                    min={0}
                    step={0.01}
                    className="[&>.relative>.bg-primary]:bg-white"
                  />
                  <div className="text-muted-foreground mt-1 flex justify-between text-xs">
                    <span>More Emotional Range</span>
                    <span>More Consistency</span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Similarity Boost: {(settings.similarity_boost * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Slider
                    value={[settings.similarity_boost]}
                    onValueChange={(values) => updateSetting('similarity_boost', values[0])}
                    max={1}
                    min={0}
                    step={0.01}
                    className="[&>.relative>.bg-primary]:bg-white"
                  />
                  <div className="text-muted-foreground mt-1 flex justify-between text-xs">
                    <span>More Variation</span>
                    <span>Match Original Voice</span>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Style: {(settings.style * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Slider
                    value={[settings.style]}
                    onValueChange={(values) => updateSetting('style', values[0])}
                    max={1}
                    min={0}
                    step={0.01}
                    className="[&>.relative>.bg-primary]:bg-white"
                  />
                  <div className="text-muted-foreground mt-1 flex justify-between text-xs">
                    <span>Neutral Style</span>
                    <span>Exaggerated Style</span>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">Speed: {settings.speed.toFixed(1)}x</span>
                  </div>
                  <Slider
                    value={[settings.speed]}
                    onValueChange={(values) => updateSetting('speed', values[0])}
                    max={1.2}
                    min={0.7}
                    step={0.1}
                    className="[&>.relative>.bg-primary]:bg-white"
                  />
                  <div className="text-muted-foreground mt-1 flex justify-between text-xs">
                    <span>Deliberate Speech</span>
                    <span>Rapid Speech</span>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">Speaker Boost</span>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Enhances voice similarity with slight latency increase
                    </p>
                  </div>
                  <Switch
                    checked={settings.use_speaker_boost}
                    onCheckedChange={(checked) => updateSetting('use_speaker_boost', checked)}
                    className="data-[state=checked]:bg-white data-[state=checked]:text-black"
                  />
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  const renderRightControls = ({ isSubmitting }: PromptControlsProps<TtsInput>) => {
    return generationTime !== null && !isSubmitting ? (
      <div className="flex items-center text-xs text-white/70">
        <span>{Math.round(generationTime)}ms</span>
      </div>
    ) : null;
  };

  const defaultValues = {
    text: '',
    ...settings,
  };

  return (
    <PromptBar
      schema={ttsSchema}
      defaultValues={defaultValues}
      promptFieldName="text"
      placeholder="Enter text to convert to speech..."
      submitTooltip="Generate speech"
      leftControls={renderControls}
      rightControls={renderRightControls}
      onSubmit={handleSubmit}
      isLoading={isGenerating || isSpeaking}
    />
  );
}

const FEATURED_VOICES = [
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
  [TTS_MODELS.MULTILINGUAL]: {
    name: 'High Quality',
    description: 'Superior quality, slower generation',
  },
  [TTS_MODELS.FLASH]: {
    name: 'Flash',
    description: 'Faster generation at 50% off, good quality',
  },
};

const DEFAULT_SETTINGS = {
  voice_id: FEATURED_VOICES[0].id,
  model_id: TTS_MODELS.MULTILINGUAL,
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0,
  speed: 1.0,
  use_speaker_boost: false,
};
