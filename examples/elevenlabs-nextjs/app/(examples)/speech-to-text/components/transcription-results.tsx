'use client';

import * as ElevenLabs from '@elevenlabs/elevenlabs-js/api';
import { UserIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { TranscriptionOptions } from './advanced-settings';

export type TranscriptionResult = Omit<
  ElevenLabs.SpeechToTextChunkResponseModel,
  'languageCode' | 'languageProbability'
> & {
  processingTimeMs?: number;
  languageCode?: string;
  languageProbability?: number;
};

export type WordGroup = {
  id: string;
  speakerId: string;
  start: number;
  end: number;
  text: string;
  words: ElevenLabs.SpeechToTextWordResponseModel[];
};

interface TranscriptionResultsProps {
  data: TranscriptionResult | null;
  wordGroups: WordGroup[];
  options: TranscriptionOptions;
  audioCurrentTime: number;
  onSeekToTime: (time: number) => void;
}

export function TranscriptionResults({
  data,
  wordGroups,
  options,
  audioCurrentTime,
  onSeekToTime,
}: TranscriptionResultsProps) {
  if (!data) {
    return (
      <div className="bg-card/50 border-muted/30 text-muted-foreground mt-4 rounded-lg border p-4 text-sm leading-relaxed">
        No transcription data available
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between border-b pb-4">
        <h2 className="text-2xl font-bold">Transcription</h2>
        {data.processingTimeMs && (
          <Badge variant="outline" className="px-2 py-1 text-xs font-medium">
            Processed in {(data.processingTimeMs / 1000).toFixed(2)}s
          </Badge>
        )}
      </div>

      <TranscriptionBadges data={data} options={options} />

      {options.timestampsGranularity !== 'none' && wordGroups.length > 0 ? (
        <div className="mt-6 space-y-6">
          {wordGroups.map((group) => (
            <SpeakerGroup
              key={group.id}
              group={group}
              currentTime={audioCurrentTime}
              onSeekToTime={onSeekToTime}
              options={options}
            />
          ))}
        </div>
      ) : data.text ? (
        <div className="bg-card/50 border-muted/30 mt-4 rounded-lg border p-4 text-sm leading-relaxed">
          {options.timestampsGranularity !== 'none' && data.words && data.words.length > 0 ? (
            <div className="space-y-2">
              <p className="text-muted-foreground mb-3 text-xs">
                Click on words to jump to their position in the audio
              </p>
              <div>
                {data.words.map((word, index) => (
                  <TranscriptWord
                    key={`simple-word-${index}`}
                    word={word}
                    groupId="simple"
                    wordIndex={index}
                    currentTime={audioCurrentTime}
                    onSeekToTime={onSeekToTime}
                    options={options}
                  />
                ))}
              </div>
            </div>
          ) : (
            <p>{data.text}</p>
          )}
        </div>
      ) : (
        <div className="bg-card/50 border-muted/30 text-muted-foreground mt-4 rounded-lg border p-4 text-sm leading-relaxed">
          No transcription data available
        </div>
      )}
    </div>
  );
}

function TranscriptionBadges({
  data,
  options,
}: {
  data: TranscriptionResult;
  options: TranscriptionOptions;
}) {
  return (
    <div className="mb-6 mt-4 flex flex-wrap gap-2">
      {data.languageCode && (
        <Badge variant="outline" className="px-2 py-1 text-xs font-medium">
          Language: {data.languageCode.toUpperCase()}
          {data.languageProbability && (
            <span className="ml-1 text-[10px] opacity-70">
              ({(data.languageProbability * 100).toFixed()}%)
            </span>
          )}
        </Badge>
      )}

      {options.diarize && (
        <Badge variant="outline" className="px-2 py-1 text-xs font-medium">
          Speakers:
          {options.numSpeakers ? (
            <span className="ml-1">Manual ({options.numSpeakers})</span>
          ) : (
            <span className="ml-1">
              Auto-detected (
              {data.words?.some((w) => w.speakerId)
                ? new Set(data.words.filter((w) => w.speakerId).map((w) => w.speakerId)).size
                : 1}
              )
            </span>
          )}
        </Badge>
      )}

      <Badge variant="outline" className="px-2 py-1 text-xs font-medium">
        Diarization: {options.diarize ? 'Enabled' : 'Disabled'}
      </Badge>

      <Badge variant="outline" className="px-2 py-1 text-xs font-medium">
        Audio Events: {options.tagAudioEvents ? 'Enabled' : 'Disabled'}
      </Badge>

      <Badge variant="outline" className="px-2 py-1 text-xs font-medium">
        Granularity: <span className="ml-1 capitalize">{options.timestampsGranularity}</span>
      </Badge>

      <Badge variant="outline" className="px-2 py-1 text-xs font-medium">
        Model: {options.modelId}
      </Badge>
    </div>
  );
}

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

interface SpeakerGroupProps {
  group: WordGroup;
  currentTime: number;
  onSeekToTime: (time: number) => void;
  options: TranscriptionOptions;
}

function SpeakerGroup({ group, currentTime, onSeekToTime, options }: SpeakerGroupProps) {
  const speakerId = group.speakerId.replace('speaker', '');
  const colorIndex = Number.parseInt(speakerId, 10) % SPEAKER_COLORS.length;
  const speakerColor = SPEAKER_COLORS[colorIndex];

  return (
    <div className="flex gap-4">
      <div className="mt-1.5 flex-shrink-0">
        <Button
          variant="outline"
          size="icon"
          className={`h-8 w-8 cursor-pointer rounded-full ${speakerColor} border-background/10 text-white hover:opacity-90`}
          onClick={() => onSeekToTime(group.start)}
          title={`Jump to ${formatTime(group.start)}`}
        >
          <UserIcon className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1">
        <div className="text-foreground/70 mb-1.5 flex items-center gap-2 text-sm">
          <span className="font-medium">Speaker {Number.parseInt(speakerId, 10) + 1}</span>
          <span className="text-muted-foreground text-xs">{formatTime(group.start)}</span>
        </div>
        <div className="bg-card/50 shadow-xs border-muted/30 rounded-lg border p-4 text-sm leading-relaxed">
          {group.words.map((word, wordIndex) => (
            <TranscriptWord
              key={`${group.id}-word-${wordIndex}`}
              word={word}
              groupId={group.id}
              wordIndex={wordIndex}
              currentTime={currentTime}
              onSeekToTime={onSeekToTime}
              options={options}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface TranscriptWordProps {
  word: ElevenLabs.SpeechToTextWordResponseModel;
  groupId: string;
  wordIndex: number;
  currentTime: number;
  onSeekToTime: (time: number) => void;
  options: TranscriptionOptions;
}

function TranscriptWord({
  word,
  groupId,
  wordIndex,
  currentTime,
  onSeekToTime,
  options,
}: TranscriptWordProps) {
  if (isNaN(word.start ?? NaN) || isNaN(word.end ?? NaN)) {
    if (word.type === 'spacing') return <span key={`${groupId}-word-${wordIndex}`}> </span>;
    return <span key={`${groupId}-word-${wordIndex}`}>{word.text}</span>;
  }

  const hasBeenPlayed = word.end !== undefined && currentTime > word.end;

  const hoverEffect = 'hover:bg-primary/10 hover:rounded-md hover:px-1 hover:-mx-1';

  const activeHighlight = 'text-foreground';
  const inactiveHighlight = 'text-muted-foreground';

  switch (word.type) {
    case 'spacing':
      return <span key={`${groupId}-word-${wordIndex}`}> </span>;
    case 'word': {
      const useCharacterHighlighting =
        options.timestampsGranularity === 'character' &&
        word.characters &&
        word.characters.length > 0;

      if (useCharacterHighlighting) {
        return (
          <>
            <span className="relative inline-flex items-baseline">
              {word.characters!.map((char, charIndex) => {
                const hasCharBeenPlayed = char.end !== undefined && currentTime > char.end;

                return (
                  <span
                    key={`${groupId}-word-${wordIndex}-char-${charIndex}`}
                    className={cn(
                      'cursor-pointer',
                      hasCharBeenPlayed ? activeHighlight : inactiveHighlight,
                      hoverEffect,
                      'hover:text-primary'
                    )}
                    onClick={() => {
                      if (char.start !== undefined) onSeekToTime(char.start);
                    }}
                  >
                    {char.text}
                  </span>
                );
              })}
            </span>
            {wordIndex < word.characters!.length - 1 && <span> </span>}
          </>
        );
      } else {
        return (
          <>
            <span
              key={`${groupId}-word-${wordIndex}`}
              className={cn(
                'cursor-pointer',
                hasBeenPlayed ? activeHighlight : inactiveHighlight,
                hoverEffect,
                'hover:text-primary'
              )}
              onClick={() => (word.start !== undefined ? onSeekToTime(word.start) : null)}
              data-time-start={word.start}
              data-time-end={word.end}
            >
              {word.text}
            </span>
            <span> </span>
          </>
        );
      }
    }
    case 'audio_event':
      return (
        <span
          key={`${groupId}-word-${wordIndex}`}
          className="mx-1 cursor-pointer rounded-md bg-amber-50 px-1.5 py-0.5 italic text-amber-800 hover:bg-amber-100"
          onClick={() => (word.start !== undefined ? onSeekToTime(word.start) : null)}
        >
          {word.text}
        </span>
      );
    default:
      return <span key={`${groupId}-word-${wordIndex}`}>{word.text}</span>;
  }
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
