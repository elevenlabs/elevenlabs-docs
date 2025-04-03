'use client';

import * as ElevenLabs from 'elevenlabs/api';
import { ChevronLeft, FileAudio, Mic, UserIcon, ChevronDown, Settings2 } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

import { transcribeAudio } from '@/app/actions/elevenlabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';

// Type definitions
type ViewState = 'upload' | 'result';

interface TranscriptionResult
  extends Omit<
    ElevenLabs.SpeechToTextChunkResponseModel,
    'language_code' | 'language_probability'
  > {
  processingTimeMs?: number;
  language_code?: string;
  language_probability?: number;
}

type WordGroup = {
  id: string;
  speaker_id: string;
  start: number;
  end: number;
  text: string;
  words: ElevenLabs.SpeechToTextWordResponseModel[];
};

export default function SpeechToTextPage() {
  const [viewState, setViewState] = useState<ViewState>('upload');
  const [audio, setAudio] = useState<{
    file: File | null;
    url: string | null;
    isPlaying: boolean;
    currentTime: number;
  }>({
    file: null,
    url: null,
    isPlaying: false,
    currentTime: 0,
  });
  const [transcription, setTranscription] = useState<{
    data: TranscriptionResult | null;
    wordGroups: WordGroup[];
    isProcessing: boolean;
  }>({
    data: null,
    wordGroups: [],
    isProcessing: false,
  });
  const [advancedOptions, setAdvancedOptions] = useState<boolean>(false);
  const [transcriptionOptions, setTranscriptionOptions] = useState<{
    model_id: string;
    timestamps_granularity: 'none' | 'word' | 'character';
    tag_audio_events: boolean;
    diarize: boolean;
    num_speakers?: number;
    language_code?: string;
  }>({
    model_id: 'scribe_v1',
    timestamps_granularity: 'character',
    tag_audio_events: true,
    diarize: true,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isCurrentWord = useCallback(
    (word: ElevenLabs.SpeechToTextWordResponseModel): boolean => {
      if (word.start === undefined || word.end === undefined) return false;
      return audio.currentTime >= word.start && audio.currentTime <= word.end;
    },
    [audio.currentTime]
  );

  const isCurrentCharacter = useCallback(
    (char: { text: string; start?: number; end?: number }): boolean => {
      if (char.start === undefined || char.end === undefined) return false;
      return audio.currentTime >= char.start && audio.currentTime <= char.end;
    },
    [audio.currentTime]
  );

  const seekToTime = useCallback(
    (time: number) => {
      if (audioRef.current) {
        audioRef.current.currentTime = time;

        setAudio((prev) => ({
          ...prev,
          currentTime: time,
        }));

        if (!audio.isPlaying) {
          audioRef.current.play().catch((err) => console.error('Error playing audio:', err));
        }
      }
    },
    [audio.isPlaying]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const selectedFile = e.target.files[0];

        if (!selectedFile.type.startsWith('audio/') && !selectedFile.type.startsWith('video/')) {
          toast.error('Please upload an audio or video file');
          return;
        }

        if (audio.url) URL.revokeObjectURL(audio.url);

        const newUrl = URL.createObjectURL(selectedFile);
        setAudio((prev) => ({
          ...prev,
          file: selectedFile,
          url: newUrl,
        }));
      }
    },
    [audio.url]
  );

  const handleTranscribe = useCallback(async () => {
    if (!audio.file) {
      toast.error('Please upload an audio file first');
      return;
    }

    setTranscription((prev) => ({ ...prev, isProcessing: true }));

    try {
      // Explicitly define all options we want to pass to the server action
      const options = {
        model_id: transcriptionOptions.model_id,
        timestamps_granularity: transcriptionOptions.timestamps_granularity,
        tag_audio_events: transcriptionOptions.tag_audio_events,
        diarize: transcriptionOptions.diarize,
      };

      // Add optional parameters only if they have values
      const apiOptions: Partial<
        typeof options & {
          num_speakers?: number;
          language_code?: string;
        }
      > = { ...options };

      if (transcriptionOptions.num_speakers) {
        apiOptions.num_speakers = transcriptionOptions.num_speakers;
      }

      if (transcriptionOptions.language_code && transcriptionOptions.language_code.trim() !== '') {
        apiOptions.language_code = transcriptionOptions.language_code.trim();
      }

      console.log('Client-side options being sent:', apiOptions);
      const startTime = performance.now();
      const result = await transcribeAudio(audio.file, apiOptions);
      const endTime = performance.now();
      const processingTimeMs = endTime - startTime;

      if (result.ok) {
        // Process word groups only if diarization is enabled and words array exists
        const wordGroups = transcriptionOptions.diarize
          ? groupWordsBySpeaker(result.value.words || [])
          : [];

        setTranscription({
          data: { ...result.value, processingTimeMs },
          wordGroups: wordGroups,
          isProcessing: false,
        });

        toast.success('Audio transcribed successfully');
        setViewState('result');
      } else {
        toast.error(result.error || 'Failed to transcribe audio');
        setTranscription((prev) => ({ ...prev, isProcessing: false }));
      }
    } catch (error) {
      console.error('Transcription error:', error);
      toast.error('An error occurred during transcription');
      setTranscription((prev) => ({ ...prev, isProcessing: false }));
    }
  }, [audio.file, transcriptionOptions]);

  const resetToUpload = useCallback(() => {
    setViewState('upload');

    if (audio.url) {
      URL.revokeObjectURL(audio.url);
    }

    setAudio({
      file: null,
      url: null,
      isPlaying: false,
      currentTime: 0,
    });

    setTranscription({
      data: null,
      wordGroups: [],
      isProcessing: false,
    });
  }, [audio.url]);

  /**
   * Set up audio event listeners when audio element changes
   * This is critical for proper word highlighting during playback
   */
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const handlePlay = () => {
      setAudio((prev) => ({ ...prev, isPlaying: true }));
    };

    const handlePause = () => {
      setAudio((prev) => ({ ...prev, isPlaying: false }));
    };

    const handleEnded = () => {
      setAudio((prev) => ({ ...prev, isPlaying: false, currentTime: 0 }));
    };

    const handleTimeUpdate = () => {
      setAudio((prev) => ({
        ...prev,
        currentTime: audioElement.currentTime,
      }));
    };

    audioElement.addEventListener('play', handlePlay);
    audioElement.addEventListener('pause', handlePause);
    audioElement.addEventListener('ended', handleEnded);
    audioElement.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      audioElement.removeEventListener('play', handlePlay);
      audioElement.removeEventListener('pause', handlePause);
      audioElement.removeEventListener('ended', handleEnded);
      audioElement.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [viewState]);

  useEffect(() => {
    return () => {
      if (audio.url) URL.revokeObjectURL(audio.url);
    };
  }, [audio.url]);

  // Store transcription options in localStorage to persist between page refreshes
  useEffect(() => {
    // Load saved options on first render
    const savedOptions = localStorage.getItem('transcriptionOptions');
    if (savedOptions) {
      try {
        const parsed = JSON.parse(savedOptions);
        setTranscriptionOptions(parsed);
      } catch (e) {
        console.error('Error parsing saved transcription options:', e);
      }
    }
  }, []);

  // Save options whenever they change
  useEffect(() => {
    localStorage.setItem('transcriptionOptions', JSON.stringify(transcriptionOptions));
  }, [transcriptionOptions]);

  const renderUploadView = () => (
    <div className="flex flex-col p-6 shadow-sm">
      <div className="mb-8 flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">Speech to Text</h1>
          <p className="text-muted-foreground">
            Convert speech to text with timestamps and speaker diarization
          </p>
        </div>
      </div>

      <div>
        <div className="mb-6">
          <label
            htmlFor="file-upload"
            className="hover:bg-muted/50 flex h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors"
          >
            <FileAudio className="text-primary/70 mb-4 h-12 w-12" />
            <p className="mb-2 text-center text-lg font-medium">
              {audio.file ? audio.file.name : 'Click to upload audio file'}
            </p>
            {audio.file && (
              <p className="text-muted-foreground text-sm">
                {(audio.file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            )}
            <input
              id="file-upload"
              type="file"
              accept="audio/*,video/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={transcription.isProcessing}
            />
          </label>
        </div>

        <div className="bg-card mb-6 rounded-lg border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Settings2 className="text-primary h-5 w-5" />
              <h3 className="font-medium">Advanced Settings</h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAdvancedOptions(!advancedOptions)}
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${advancedOptions ? 'rotate-180' : ''}`}
              />
            </Button>
          </div>

          {advancedOptions && (
            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="bg-muted/50 space-y-2 rounded-lg p-4">
                  <h4 className="mb-3 font-medium">Speaker Diarization</h4>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="diarization"
                      checked={transcriptionOptions.diarize}
                      onCheckedChange={(checked) =>
                        setTranscriptionOptions((prev) => ({
                          ...prev,
                          diarize: checked === true,
                        }))
                      }
                    />
                    <Label htmlFor="diarization" className="font-normal">
                      Identify different speakers
                    </Label>
                  </div>
                </div>

                <div className="bg-muted/50 space-y-2 rounded-lg p-4">
                  <h4 className="mb-3 font-medium">Audio Events</h4>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="tag_audio_events"
                      checked={transcriptionOptions.tag_audio_events}
                      onCheckedChange={(checked) =>
                        setTranscriptionOptions((prev) => ({
                          ...prev,
                          tag_audio_events: checked === true,
                        }))
                      }
                    />
                    <Label htmlFor="tag_audio_events" className="font-normal">
                      Tag sounds like (laughter), (footsteps), etc.
                    </Label>
                  </div>
                </div>
              </div>

              <Separator className="my-2" />

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium">Number of Speakers (optional)</h4>
                  <Input
                    id="num_speakers"
                    type="number"
                    min="1"
                    max="32"
                    placeholder="Auto-detect (default)"
                    value={transcriptionOptions.num_speakers || ''}
                    onChange={(e) =>
                      setTranscriptionOptions((prev) => ({
                        ...prev,
                        num_speakers: e.target.value ? parseInt(e.target.value) : undefined,
                      }))
                    }
                    className="max-w-full"
                  />
                  <p className="text-muted-foreground text-xs">
                    Leave empty for auto-detection (max 32 speakers)
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Language Code (optional)</h4>
                  <Input
                    id="language_code"
                    type="text"
                    placeholder="e.g., en, fr, es, de"
                    value={transcriptionOptions.language_code || ''}
                    onChange={(e) =>
                      setTranscriptionOptions((prev) => ({
                        ...prev,
                        language_code: e.target.value || undefined,
                      }))
                    }
                    className="max-w-full"
                  />
                  <p className="text-muted-foreground text-xs">
                    ISO-639-1 or ISO-639-3 code. Leave empty for auto-detection.
                  </p>
                </div>
              </div>

              <div className="bg-muted/50 mt-2 space-y-3 rounded-lg p-4">
                <h4 className="font-medium">Timestamp Granularity</h4>
                <RadioGroup
                  value={transcriptionOptions.timestamps_granularity}
                  onValueChange={(value) =>
                    setTranscriptionOptions((prev) => ({
                      ...prev,
                      timestamps_granularity: value as 'none' | 'word' | 'character',
                    }))
                  }
                  className="flex flex-wrap gap-4"
                >
                  {['none', 'word', 'character'].map((value) => (
                    <div key={value} className="flex items-center space-x-2">
                      <RadioGroupItem id={value} value={value} />
                      <Label htmlFor={value} className="font-normal capitalize">
                        {value}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                <p className="text-muted-foreground mt-1 text-xs">
                  Controls how detailed the word timing information will be
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button
            size="lg"
            onClick={handleTranscribe}
            disabled={!audio.file || transcription.isProcessing}
            className="px-8"
          >
            {transcription.isProcessing ? (
              <>
                <svg
                  className="mr-2 h-5 w-5 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Transcribing...
              </>
            ) : (
              <>
                <Mic className="mr-2 h-5 w-5" />
                Transcribe Audio
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  const TranscriptWord = ({
    word,
    groupId,
    wordIndex,
  }: {
    word: ElevenLabs.SpeechToTextWordResponseModel;
    groupId: string;
    wordIndex: number;
  }) => {
    // Skip words with invalid timestamps if playing audio
    if (audioRef.current && (isNaN(word.start ?? NaN) || isNaN(word.end ?? NaN))) {
      if (word.type === 'spacing') return <span key={`${groupId}-word-${wordIndex}`}> </span>;
      return <span key={`${groupId}-word-${wordIndex}`}>{word.text}</span>;
    }

    // Determine if word should have highlighting based on playback position
    const isCurrentlyPlaying =
      word.start !== undefined &&
      word.end !== undefined &&
      audio.currentTime >= word.start &&
      audio.currentTime <= word.end;

    const hasBeenPlayed = word.end !== undefined && audio.currentTime > word.end;

    // Reusable animation classes - NO TRANSITIONS TO AVOID PULSING
    const hoverEffect = 'hover:bg-primary/10 hover:rounded-md hover:px-1 hover:-mx-1';
    const activeHighlight = 'text-primary font-medium bg-primary/15 px-1 -mx-1 rounded-md';

    switch (word.type) {
      case 'spacing':
        return <span key={`${groupId}-word-${wordIndex}`}> </span>;
      case 'word': {
        // Check if we should use character-level highlighting
        const useCharacterHighlighting =
          transcriptionOptions.timestamps_granularity === 'character' &&
          word.characters &&
          word.characters.length > 0;

        if (useCharacterHighlighting) {
          // Character-level rendering with no transitions
          return (
            <>
              <span className="relative inline-flex items-baseline">
                {word.characters!.map((char, charIndex) => {
                  // Determine character highlight state
                  const isCharCurrentlyPlaying =
                    char.start !== undefined &&
                    char.end !== undefined &&
                    audio.currentTime >= char.start &&
                    audio.currentTime <= char.end;

                  const hasCharBeenPlayed = char.end !== undefined && audio.currentTime > char.end;

                  return (
                    <span
                      key={`${groupId}-word-${wordIndex}-char-${charIndex}`}
                      className={`cursor-pointer ${
                        isCharCurrentlyPlaying
                          ? `${activeHighlight}`
                          : hasCharBeenPlayed
                            ? 'text-foreground hover:text-primary'
                            : 'text-foreground/80 hover:text-primary'
                      } ${hoverEffect} `}
                      onClick={() => {
                        if (char.start !== undefined) seekToTime(char.start);
                      }}
                    >
                      {char.text}
                    </span>
                  );
                })}
              </span>
              {wordIndex <
                (groupId === 'simple'
                  ? transcription.data?.words?.length || 0
                  : transcription.wordGroups.find((g) => g.id === groupId)?.words.length || 0) -
                  1 && <span> </span>}
            </>
          );
        } else {
          // Word-level rendering with no transitions
          return (
            <>
              <span
                key={`${groupId}-word-${wordIndex}`}
                className={`cursor-pointer ${
                  isCurrentlyPlaying
                    ? `${activeHighlight}`
                    : hasBeenPlayed
                      ? 'text-foreground hover:text-primary'
                      : 'text-foreground/80 hover:text-primary'
                } ${hoverEffect} `}
                onClick={() => (word.start !== undefined ? seekToTime(word.start) : null)}
                data-time-start={word.start}
                data-time-end={word.end}
              >
                {word.text}
              </span>
              {wordIndex <
                (groupId === 'simple'
                  ? transcription.data?.words?.length || 0
                  : transcription.wordGroups.find((g) => g.id === groupId)?.words.length || 0) -
                  1 && <span> </span>}
            </>
          );
        }
      }
      case 'audio_event':
        return (
          <span
            key={`${groupId}-word-${wordIndex}`}
            className="mx-1 cursor-pointer rounded-md bg-amber-50 px-1.5 py-0.5 italic text-amber-800 hover:bg-amber-100"
            onClick={() => (word.start !== undefined ? seekToTime(word.start) : null)}
          >
            {word.text}
          </span>
        );
      default:
        return <span key={`${groupId}-word-${wordIndex}`}>{word.text}</span>;
    }
  };

  const SPEAKER_COLORS = [
    'bg-blue-500/90',
    'bg-emerald-500/90',
    'bg-amber-500/90',
    'bg-rose-500/90',
    'bg-purple-500/90',
    'bg-cyan-500/90',
    'bg-indigo-500/90',
    'bg-teal-500/90',
  ];

  const TranscriptionBadges = ({
    data,
    options,
  }: {
    data: TranscriptionResult | null;
    options: {
      model_id: string;
      timestamps_granularity: 'none' | 'word' | 'character';
      tag_audio_events: boolean;
      diarize: boolean;
      num_speakers?: number;
      language_code?: string;
    };
  }) => {
    if (!data) return null;

    return (
      <div className="mb-6 mt-4 flex flex-wrap gap-2">
        {/* Language Badge */}
        {data.language_code && (
          <Badge variant="outline" className="px-2 py-1 text-xs font-medium">
            Language: {data.language_code.toUpperCase()}
            {data.language_probability && (
              <span className="ml-1 text-[10px] opacity-70">
                ({(data.language_probability * 100).toFixed()}%)
              </span>
            )}
          </Badge>
        )}

        {/* Speakers Badge */}
        {options.diarize && (
          <Badge variant="outline" className="px-2 py-1 text-xs font-medium">
            Speakers:
            {options.num_speakers ? (
              <span className="ml-1">Manual ({options.num_speakers})</span>
            ) : (
              <span className="ml-1">
                Auto-detected (
                {data.words?.some((w) => w.speaker_id)
                  ? new Set(data.words.filter((w) => w.speaker_id).map((w) => w.speaker_id)).size
                  : 1}
                )
              </span>
            )}
          </Badge>
        )}

        {/* Speaker Diarization Badge */}
        <Badge variant="outline" className="px-2 py-1 text-xs font-medium">
          Diarization: {options.diarize ? 'Enabled' : 'Disabled'}
        </Badge>

        {/* Audio Events Badge */}
        <Badge variant="outline" className="px-2 py-1 text-xs font-medium">
          Audio Events: {options.tag_audio_events ? 'Enabled' : 'Disabled'}
        </Badge>

        {/* Timestamp Granularity Badge */}
        <Badge variant="outline" className="px-2 py-1 text-xs font-medium">
          Granularity: <span className="ml-1 capitalize">{options.timestamps_granularity}</span>
        </Badge>

        {/* Model Badge */}
        <Badge variant="outline" className="px-2 py-1 text-xs font-medium">
          Model: {options.model_id}
        </Badge>
      </div>
    );
  };

  const renderResultView = () => (
    <div className="flex flex-col p-6 shadow-sm">
      <div className="mb-6 flex items-center">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1.5"
          onClick={resetToUpload}
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back</span>
        </Button>
      </div>

      <div className="space-y-6">
        {audio.url && (
          <div className="bg-card rounded-lg border p-3 shadow-sm">
            <audio
              ref={audioRef}
              src={audio.url}
              className="w-full"
              controls={true}
              preload="auto"
            />
          </div>
        )}

        <div>
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-2xl font-bold">Transcription</h2>
            {transcription.data?.processingTimeMs && (
              <Badge variant="outline" className="px-2 py-1 text-xs font-medium">
                Processed in {(transcription.data.processingTimeMs / 1000).toFixed(2)}s
              </Badge>
            )}
          </div>

          <TranscriptionBadges data={transcription.data} options={transcriptionOptions} />

          {transcriptionOptions.timestamps_granularity !== 'none' &&
          transcription.wordGroups.length > 0 ? (
            <div className="mt-6 space-y-6">
              {transcription.wordGroups.map((group) => {
                const speakerId = group.speaker_id.replace('speaker_', '');
                const colorIndex = parseInt(speakerId, 10) % SPEAKER_COLORS.length;
                const speakerColor = SPEAKER_COLORS[colorIndex];

                return (
                  <div key={group.id} className="flex gap-4">
                    <div className="mt-1.5 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="icon"
                        className={`h-8 w-8 cursor-pointer rounded-full ${speakerColor} border-background/10 text-white hover:opacity-90`}
                        onClick={() => seekToTime(group.start)}
                        title={`Jump to ${formatTime(group.start)}`}
                      >
                        <UserIcon className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex-1">
                      <div className="text-foreground/70 mb-1.5 flex items-center gap-2 text-sm">
                        <span className="font-medium">Speaker {parseInt(speakerId, 10) + 1}</span>
                        <span className="text-muted-foreground text-xs">
                          {formatTime(group.start)}
                        </span>
                      </div>
                      <div className="bg-card/50 shadow-xs border-muted/30 rounded-lg border p-4 text-sm leading-relaxed">
                        {group.words.map((word, wordIndex) => (
                          <TranscriptWord
                            key={`${group.id}-word-${wordIndex}`}
                            word={word}
                            groupId={group.id}
                            wordIndex={wordIndex}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : transcription.data?.text ? (
            <div className="bg-card/50 border-muted/30 mt-4 rounded-lg border p-4 text-sm leading-relaxed">
              {transcriptionOptions.timestamps_granularity !== 'none' &&
              transcription.data.words &&
              transcription.data.words.length > 0 ? (
                <div className="space-y-2">
                  {audio.url && (
                    <p className="text-muted-foreground mb-3 text-xs">
                      Click on words to jump to their position in the audio
                    </p>
                  )}
                  <div>
                    {transcription.data.words.map((word, index) => (
                      <TranscriptWord
                        key={`simple-word-${index}`}
                        word={word}
                        groupId="simple"
                        wordIndex={index}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <p>{transcription.data.text}</p>
              )}
            </div>
          ) : (
            <div className="bg-card/50 border-muted/30 text-muted-foreground mt-4 rounded-lg border p-4 text-sm leading-relaxed">
              No transcription data available
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto max-w-5xl py-4">
      {viewState === 'upload' ? renderUploadView() : renderResultView()}
    </div>
  );
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const groupWordsBySpeaker = (words: ElevenLabs.SpeechToTextWordResponseModel[]): WordGroup[] => {
  const groups: WordGroup[] = [];
  let currentGroup: WordGroup | null = null;

  words.forEach((word, index) => {
    // Skip words with invalid timestamps
    if (isNaN(word.start ?? NaN) || isNaN(word.end ?? NaN)) return;

    if (!currentGroup || currentGroup.speaker_id !== (word.speaker_id || 'unknown')) {
      currentGroup = {
        id: `group-${index}`,
        speaker_id: word.speaker_id || 'unknown',
        start: word.start || 0,
        end: word.end || 0,
        text: '',
        words: [],
      };
      groups.push(currentGroup);
    }

    currentGroup.words.push(word);
    if (word.end !== undefined && !isNaN(word.end)) currentGroup.end = word.end;
    currentGroup.text += word.text;
  });

  return groups;
};
