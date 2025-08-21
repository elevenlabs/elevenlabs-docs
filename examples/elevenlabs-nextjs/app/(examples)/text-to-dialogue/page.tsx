"use client";

import { useState } from "react";

import { AudioPlayer } from "@/app/(examples)/text-to-dialogue/components/audio-player";
import { TextToDialoguePromptBar } from "@/components/prompt-bar/text-to-dialogue";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

type DialogueItem = {
  id: string;
  audioUrl: string;
  timestamp: Date;
};

export default function TextToDialoguePage() {
  const [dialogues, setDialogues] = useState<DialogueItem[]>([]);

  const handleGenerateStart = () => {
    // Generation started
  };

  const handleGenerateComplete = (id: string, audioUrl: string) => {
    const newDialogue: DialogueItem = {
      id,
      audioUrl,
      timestamp: new Date(),
    };

    setDialogues((prev) => [newDialogue, ...prev]);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-hidden">
        <div className="mx-auto h-full max-w-4xl p-6">
          <div className="mb-6">
            <h1 className="mb-2 text-3xl font-bold text-white">
              Text to Dialogue
            </h1>
            <p className="text-muted-foreground">
              Create conversations between multiple voices using the ElevenLabs
              text-to-dialogue API.
            </p>
          </div>

          {/* Generated Dialogues */}
          {dialogues.length > 0 && (
            <Card className="mb-6 border-white/10 bg-white/5 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">
                  Generated Dialogues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4">
                    {dialogues.map((dialogue) => (
                      <DialogueCard key={dialogue.id} dialogue={dialogue} />
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Prompt Bar */}
      <div className="border-t border-white/10 bg-black/20 p-6 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl">
          <TextToDialoguePromptBar
            onGenerateStart={handleGenerateStart}
            onGenerateComplete={handleGenerateComplete}
          />
        </div>
      </div>
    </div>
  );
}

type DialogueCardProps = {
  dialogue: DialogueItem;
};

function DialogueCard({ dialogue }: DialogueCardProps) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <div className="mb-2 text-xs text-white/50">
        {dialogue.timestamp.toLocaleTimeString()}
      </div>
      <AudioPlayer src={dialogue.audioUrl} />
    </div>
  );
}
