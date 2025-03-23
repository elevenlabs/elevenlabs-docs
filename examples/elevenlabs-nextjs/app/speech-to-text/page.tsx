'use client';

import * as ElevenLabs from 'elevenlabs/api';
import { ChevronLeft, FileAudio, Mic, UserIcon } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

import { transcribeAudio } from '@/app/actions/elevenlabs';
import { Button } from '@/components/ui/button';

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

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isCurrentWord = useCallback(
    (word: ElevenLabs.SpeechToTextWordResponseModel): boolean => {
      if (word.start === undefined || word.end === undefined) return false;
      return audio.currentTime >= word.start && audio.currentTime <= word.end;
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
      const result = await transcribeAudio(audio.file, {
        model_id: 'scribe_v1',
        timestamps_granularity: 'character',
        tag_audio_events: true,
        diarize: true,
      });

      if (result.ok) {
        const wordGroups = groupWordsBySpeaker(result.value.words || []);

        setTranscription({
          data: result.value,
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
  }, [audio.file]);

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

  const renderUploadView = () => (
    <div className="flex flex-col p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Speech to text</h1>
          <p className="text-muted-foreground">
            Convert speech to text with timestamps and speaker diarization
          </p>
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-6">
          <label
            htmlFor="file-upload"
            className="hover:bg-muted/50 flex h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors"
          >
            <FileAudio className="text-muted-foreground mb-4 h-12 w-12" />
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
    switch (word.type) {
      case 'spacing':
        return <span key={`${groupId}-word-${wordIndex}`}> </span>;
      case 'word':
        return (
          <span
            key={`${groupId}-word-${wordIndex}`}
            className={`cursor-pointer ${
              isCurrentWord(word)
                ? 'text-primary'
                : audio.currentTime > (word.end ?? Infinity)
                  ? 'text-foreground'
                  : 'text-muted-foreground'
            }`}
            onClick={() => (word.start !== undefined ? seekToTime(word.start) : null)}
            data-time-start={word.start}
            data-time-end={word.end}
          >
            {word.text}
          </span>
        );
      case 'audio_event':
        return (
          <span
            key={`${groupId}-word-${wordIndex}`}
            className="mx-1 cursor-pointer italic text-slate-500"
            onClick={() => (word.start !== undefined ? seekToTime(word.start) : null)}
          >
            {word.text}
          </span>
        );
      default:
        return null;
    }
  };

  const renderResultView = () => (
    <div className="flex flex-col p-6 shadow-sm">
      <div className="mb-6 flex items-center">
        <Button
          variant="ghost"
          size="sm"
          className="mb-2 flex items-center gap-1"
          onClick={resetToUpload}
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Upload</span>
        </Button>
      </div>

      <div className="space-y-6">
        {audio.url && (
          <audio ref={audioRef} src={audio.url} className="w-full" controls={true} preload="auto" />
        )}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xl font-bold">Transcription</h2>
            {transcription.data?.processingTimeMs && (
              <div className="text-muted-foreground text-xs">
                Processed in {transcription.data.processingTimeMs.toLocaleString()}ms
              </div>
            )}
          </div>

          {transcription.wordGroups.length > 0 ? (
            <div className="mt-4 space-y-6">
              {transcription.wordGroups.map((group) => {
                const speakerId = group.speaker_id.replace('speaker_', '');
                const colorIndex = parseInt(speakerId, 10) % SPEAKER_COLORS.length;
                const speakerColor = SPEAKER_COLORS[colorIndex];

                return (
                  <div key={group.id} className="flex gap-3">
                    <div className="mt-1 flex-shrink-0">
                      <div
                        className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-white shadow-sm hover:shadow ${speakerColor}`}
                        onClick={() => seekToTime(group.start)}
                        title={`Jump to ${formatTime(group.start)}`}
                      >
                        <UserIcon className="h-4 w-4" />
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="text-muted-foreground mb-1 text-xs">
                        Speaker {parseInt(speakerId, 10) + 1} • {formatTime(group.start)}
                      </div>
                      <div className="bg-muted rounded-lg p-3 text-sm leading-relaxed">
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
            <div className="bg-muted mt-4 rounded-lg p-4 text-sm leading-relaxed">
              <p>{transcription.data.text}</p>
            </div>
          ) : (
            <div className="bg-muted text-muted-foreground mt-4 rounded-lg p-4 text-sm">
              No transcription data available
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto">
      {viewState === 'upload' ? renderUploadView() : renderResultView()}
    </div>
  );
}

const SPEAKER_COLORS = [
  'bg-gray-500',
  'bg-zinc-400',
  'bg-slate-500',
  'bg-neutral-500',
  'bg-stone-500',
  'bg-gray-600',
  'bg-zinc-600',
  'bg-slate-600',
];

type ViewState = 'upload' | 'result';

interface TranscriptionResult extends ElevenLabs.SpeechToTextChunkResponseModel {
  processingTimeMs?: number;
}

type WordGroup = {
  id: string;
  speaker_id: string;
  start: number;
  end: number;
  text: string;
  words: ElevenLabs.SpeechToTextWordResponseModel[];
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const groupWordsBySpeaker = (words: ElevenLabs.SpeechToTextWordResponseModel[]): WordGroup[] => {
  const groups: WordGroup[] = [];
  let currentGroup: WordGroup | null = null;

  words.forEach((word, index) => {
    if (word.start === undefined || word.end === undefined) return;

    if (!currentGroup || currentGroup.speaker_id !== (word.speaker_id || 'unknown')) {
      currentGroup = {
        id: `group-${index}`,
        speaker_id: word.speaker_id || 'unknown',
        start: word.start,
        end: word.end,
        text: '',
        words: [],
      };
      groups.push(currentGroup);
    }

    currentGroup.words.push(word);
    if (word.end !== undefined) currentGroup.end = word.end;
    currentGroup.text += word.text;
  });

  return groups;
};
