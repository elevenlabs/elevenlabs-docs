'use client';

import type { BodySpeechToTextV1SpeechToTextPost } from '@elevenlabs/elevenlabs-js/api';
import { ChevronDown, Settings2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';

export type TranscriptionOptions = Omit<BodySpeechToTextV1SpeechToTextPost, 'file'>;

interface AdvancedSettingsProps {
  options: TranscriptionOptions;
  onChange: (options: TranscriptionOptions) => void;
}

export default function AdvancedSettings({ options, onChange }: AdvancedSettingsProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  return (
    <div className="bg-card mb-6 rounded-lg border p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Settings2 className="text-primary h-5 w-5" />
          <h3 className="font-medium">Advanced Settings</h3>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </Button>
      </div>

      {isExpanded && (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="bg-muted/50 space-y-2 rounded-lg p-4">
              <h4 className="mb-3 font-medium">Speaker Diarization</h4>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="diarization"
                  checked={options.diarize}
                  onCheckedChange={(checked) =>
                    onChange({
                      ...options,
                      diarize: checked === true,
                    })
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
                  checked={options.tagAudioEvents}
                  onCheckedChange={(checked) =>
                    onChange({
                      ...options,
                      tagAudioEvents: checked === true,
                    })
                  }
                />
                <Label htmlFor="tag_audio_events" className="font-normal">
                  Tag audio events (e.g. laughter)
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
                value={options.numSpeakers || ''}
                onChange={(e) =>
                  onChange({
                    ...options,
                    numSpeakers: e.target.value ? Number.parseInt(e.target.value) : undefined,
                  })
                }
                className="max-w-full"
              />
              <p className="text-muted-foreground text-xs">Leave empty for auto-detection</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Language Code (optional)</h4>
              <Input
                id="language_code"
                type="text"
                placeholder="e.g., en, fr, es, de"
                value={options.languageCode || ''}
                onChange={(e) =>
                  onChange({
                    ...options,
                    languageCode: e.target.value || undefined,
                  })
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
              value={options.timestampsGranularity}
              onValueChange={(value) =>
                onChange({
                  ...options,
                  timestampsGranularity: value as 'none' | 'word' | 'character',
                })
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
  );
}
