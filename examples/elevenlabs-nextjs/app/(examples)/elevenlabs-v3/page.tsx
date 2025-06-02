'use client';

import { nanoid } from 'nanoid';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';

import { SimpleAudioPlayer, loadAndPlay } from '@/components/audio-player';
import { DialoguePromptSuggestions } from '@/components/dialogue-prompt-suggestions';
import {
  TextToDialoguePromptBar,
  TextToDialoguePromptBarRef,
} from '@/components/prompt-bar/text-to-dialogue';

export default function TextToSpeechPage() {
  const [speeches, setSpeeches] = useState<GeneratedSpeech[]>([]);
  const [selectedSpeech, setSelectedSpeech] = useState<GeneratedSpeech | null>(null);
  const [autoplay, setAutoplay] = useState(true);
  const promptBarRef = useRef<TextToDialoguePromptBarRef>(null);

  const handleGenerateStart = useCallback((text: string) => {
    const pendingSpeech: GeneratedSpeech = {
      id: nanoid(),
      text,
      audioBase64: '',
      createdAt: new Date(),
      status: 'loading',
    };

    setSpeeches((prev) => [pendingSpeech, ...prev]);
    setSelectedSpeech(pendingSpeech);
    return pendingSpeech.id;
  }, []);

  const handleGenerateComplete = useCallback(
    (id: string, text: string, audioUrl: string) => {
      if (!audioUrl) {
        toast.error('Failed to generate speech audio');
        setSpeeches((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: 'error' as const } : item))
        );
        return;
      }

      setSpeeches((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                text,
                audioBase64: audioUrl,
                status: 'complete' as const,
              }
            : item
        )
      );

      setSelectedSpeech((current) =>
        current?.id === id
          ? {
              ...current,
              text,
              audioBase64: audioUrl,
              status: 'complete' as const,
            }
          : current
      );

      // Use the SimpleAudioPlayer to play the audio
      if (autoplay) {
        loadAndPlay({
          title: 'Generated Dialogue',
          audioUrl: audioUrl,
          slug: id,
          description: text,
        });
      }
    },
    [autoplay]
  );

  const handleSuggestionClick = useCallback((prompt: string) => {
    // Set the prompt value in the input field
    if (promptBarRef.current) {
      promptBarRef.current.setPrompt(prompt);
    }
  }, []);

  return (
    <>
      <div
        className="flex items-center justify-center overflow-hidden"
        style={{ height: 'calc(100vh - 60px)' }}
      >
        <div className="container mx-auto">
          <div className="mx-auto max-w-4xl space-y-6">
            <TextToDialoguePromptBar
              onGenerateStart={handleGenerateStart}
              onGenerateComplete={handleGenerateComplete}
              ref={promptBarRef}
            />

            {/* Prompt Suggestions */}
            <div className="flex flex-col gap-3">
              <DialoguePromptSuggestions handleClick={handleSuggestionClick} />
            </div>
          </div>
        </div>
      </div>

      {/* Add the SimpleAudioPlayer component */}
      <SimpleAudioPlayer />
    </>
  );
}

interface GeneratedSpeech {
  id: string;
  text: string;
  audioBase64: string;
  createdAt: Date;
  status: 'loading' | 'complete' | 'error';
}
