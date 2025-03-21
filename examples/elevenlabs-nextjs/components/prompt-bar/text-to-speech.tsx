'use client';

import { BoltIcon, MicIcon, SparklesIcon, SpeakerIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { generateSpeech, getVoices } from '@/app/actions';
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
import { FEATURED_VOICES, TTS_MODEL_INFO, TTS_MODELS, TtsInput, ttsSchema } from '@/lib/schemas';

export type TextToSpeechPromptProps = {
  onGenerateStart: (text: string) => string;
  onGenerateComplete: (id: string, text: string, audioBase64: string) => void;
};

const DEFAULT_VALUES: TtsInput = {
  text: '',
  voice_id: FEATURED_VOICES[0].id,
  model_id: TTS_MODELS.MULTILINGUAL,
  stability: 0.5,
  clarity: 0.75,
  style: 0.35,
  speed: 1.0,
};

// Simple utility for localStorage with proper typing
const storage = {
  get: <T,>(key: string, defaultValue: T): T => {
    try {
      const value = localStorage.getItem(key);
      return value !== null ? JSON.parse(value) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set: <T,>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage', error);
    }
  },
};

export function TextToSpeechPrompt({
  onGenerateStart,
  onGenerateComplete,
}: TextToSpeechPromptProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [voices, setVoices] = useState<Array<{ voice_id: string; name: string }>>([]);

  // Speed measurement state
  const [generationTime, setGenerationTime] = useState<number | null>(null);

  // Main settings state - only one state object for all settings
  const [settings, setSettings] = useState<{
    voice_id: string;
    model_id: typeof TTS_MODELS.MULTILINGUAL | typeof TTS_MODELS.FLASH;
    stability: number;
    clarity: number;
    style: number;
    speed: number;
  }>({
    voice_id: DEFAULT_VALUES.voice_id,
    model_id: DEFAULT_VALUES.model_id,
    stability: DEFAULT_VALUES.stability,
    clarity: DEFAULT_VALUES.clarity,
    style: DEFAULT_VALUES.style,
    speed: DEFAULT_VALUES.speed,
  });

  // Load initial data
  useEffect(() => {
    async function init() {
      try {
        // Load saved settings from localStorage
        const savedVoiceId = storage.get<string>('tts_voice_id', DEFAULT_VALUES.voice_id);
        const savedModelId = storage.get<string>('tts_model_id', DEFAULT_VALUES.model_id);
        const savedStability = storage.get<number>('tts_stability', DEFAULT_VALUES.stability);
        const savedClarity = storage.get<number>('tts_clarity', DEFAULT_VALUES.clarity);
        const savedStyle = storage.get<number>('tts_style', DEFAULT_VALUES.style);
        const savedSpeed = storage.get<number>('tts_speed', DEFAULT_VALUES.speed);

        // Make sure model_id is valid
        let validModelId: typeof TTS_MODELS.MULTILINGUAL | typeof TTS_MODELS.FLASH =
          DEFAULT_VALUES.model_id;
        if (savedModelId === TTS_MODELS.MULTILINGUAL || savedModelId === TTS_MODELS.FLASH) {
          validModelId = savedModelId;
        }

        // Update state with saved settings
        setSettings({
          voice_id: savedVoiceId,
          model_id: validModelId,
          stability: savedStability,
          clarity: savedClarity,
          style: savedStyle,
          speed: savedSpeed,
        });

        // Load voices
        const result = await getVoices();
        if (result.ok) {
          setVoices(result.value);
        } else {
          // Fallback to featured voices
          setVoices(FEATURED_VOICES.map((v) => ({ voice_id: v.id, name: v.name })));
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    // Don't save during initial loading
    if (isLoading) return;

    storage.set('tts_voice_id', settings.voice_id);
    storage.set('tts_model_id', settings.model_id);
    storage.set('tts_stability', settings.stability);
    storage.set('tts_clarity', settings.clarity);
    storage.set('tts_style', settings.style);
    storage.set('tts_speed', settings.speed);
  }, [settings, isLoading]);

  // Get voice name from ID
  const getVoiceName = (voiceId: string): string => {
    // Check available voices
    const voice = voices.find((v) => v.voice_id === voiceId);
    if (voice) return voice.name;

    // Check featured voices
    const featuredVoice = FEATURED_VOICES.find((v) => v.id === voiceId);
    if (featuredVoice) return featuredVoice.name;

    return 'Select Voice';
  };

  // Update a single setting
  const updateSetting = (key: keyof typeof settings, value: string | number) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (data: TtsInput) => {
    try {
      setIsGenerating(true);

      // Start timing the generation
      const startTime = performance.now();
      setGenerationTime(null);

      // Use the latest settings for generation, but take the text from the form
      const generateData = {
        ...settings,
        text: data.text,
      };

      const pendingId = onGenerateStart(data.text);
      const result = await generateSpeech(generateData);

      // Measure end time and calculate elapsed time
      const endTime = performance.now();
      const elapsed = endTime - startTime;
      setGenerationTime(elapsed);

      if (result.ok) {
        onGenerateComplete(pendingId, data.text, result.value.audioBase64);
        toast.success('Generated speech');
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      toast.error(`An unexpected error occurred: ${err}`);
      setGenerationTime(null);
    } finally {
      setIsGenerating(false);
    }
  };

  // Function to sync form values with settings
  function syncFormWithSettings(form: PromptControlsProps<TtsInput>['form']) {
    if (!isLoading) {
      form.setValue('voice_id', settings.voice_id);
      form.setValue('model_id', settings.model_id);
      form.setValue('stability', settings.stability);
      form.setValue('clarity', settings.clarity);
      form.setValue('style', settings.style);
      form.setValue('speed', settings.speed);
    }
  }

  // Sync form values with settings whenever the form changes
  const renderControls = ({ form }: PromptControlsProps<TtsInput>) => {
    // Using a custom hook would be better, but for now, we'll just use a ref to track the form
    // This avoids the React Hook rule violation
    const modelInfo = TTS_MODEL_INFO[settings.model_id as keyof typeof TTS_MODEL_INFO];
    const voiceName = getVoiceName(settings.voice_id);

    // Sync form values with settings (without hooks)
    if (!isLoading) {
      // This is safe to call during render as it just updates form values
      syncFormWithSettings(form);
    }

    if (isLoading) {
      return (
        <div className="flex flex-wrap gap-1.5">
          {/* Loading indicators */}
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

          {/* Model Selection */}
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

          {/* Voice Settings */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-[36px] w-[36px] rounded-full border border-white/10 bg-transparent p-1.5 text-white/50 hover:bg-white/20 hover:text-white"
              >
                <SpeakerIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 border border-white/10 bg-[#2B2B2B] text-white">
              <DropdownMenuLabel>Voice Settings</DropdownMenuLabel>
              <div className="p-4">
                <div className="mb-4">
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
                    <span>More Expressive</span>
                    <span>More Stable</span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Clarity: {(settings.clarity * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Slider
                    value={[settings.clarity]}
                    onValueChange={(values) => updateSetting('clarity', values[0])}
                    max={1}
                    min={0}
                    step={0.01}
                    className="[&>.relative>.bg-primary]:bg-white"
                  />
                  <div className="text-muted-foreground mt-1 flex justify-between text-xs">
                    <span>More Natural</span>
                    <span>More Clear</span>
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
                    <span>Less Style</span>
                    <span>More Style</span>
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
                    <span>Slower</span>
                    <span>Faster</span>
                  </div>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  const renderRightControls = ({ isSubmitting }: PromptControlsProps<TtsInput>) => {
    return (
      <>
        {/* Generation time display */}
        {generationTime !== null && !isSubmitting && (
          <div className="flex items-center text-xs text-white/70">
            <span>{Math.round(generationTime)}ms</span>
          </div>
        )}
      </>
    );
  };

  // Form default values, using current settings
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
      isLoading={isGenerating}
    />
  );
}
