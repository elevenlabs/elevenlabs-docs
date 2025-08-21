"use client";

import { ChevronLeft, Mic } from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";

import AdvancedSettings, {
  TranscriptionOptions,
} from "@/app/(examples)/speech-to-text/components/advanced-settings";
import { AudioPlayer } from "@/app/(examples)/speech-to-text/components/audio-player";
import { FileUpload } from "@/app/(examples)/speech-to-text/components/file-upload";
import {
  TranscriptionResults,
  TranscriptionResult,
  WordGroup,
} from "@/app/(examples)/speech-to-text/components/transcription-results";
import { createTranscription } from "@/app/actions/create-transcription";
import { Button } from "@/components/ui/button";
import { STT_MODELS } from "@/lib/schemas";

import { groupWordsBySpeaker } from "./lib/transcription-utils";

type ViewState = "upload" | "result";

export default function Page() {
  const [viewState, setViewState] = useState<ViewState>("upload");
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

  const [transcriptionOptions, setTranscriptionOptions] =
    useState<TranscriptionOptions>({
      modelId: STT_MODELS.SCRIBE_V1,
      timestampsGranularity: "character",
      tagAudioEvents: true,
      diarize: true,
    });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const seekToTime = useCallback(
    (time: number) => {
      if (audioRef.current) {
        audioRef.current.currentTime = time;

        setAudio((prev) => ({
          ...prev,
          currentTime: time,
        }));

        if (!audio.isPlaying) {
          audioRef.current
            .play()
            .catch((err) => console.error("Error playing audio:", err));
        }
      }
    },
    [audio.isPlaying]
  );

  const handleFileChange = useCallback(
    (selectedFile: File | null) => {
      if (!selectedFile) return;

      if (audio.url) URL.revokeObjectURL(audio.url);

      const newUrl = URL.createObjectURL(selectedFile);
      setAudio((prev) => ({
        ...prev,
        file: selectedFile,
        url: newUrl,
      }));
    },
    [audio.url]
  );

  const handleTranscribe = useCallback(async () => {
    if (!audio.file) {
      toast.error("Please upload an audio file");
      return;
    }

    setTranscription((prev) => ({ ...prev, isProcessing: true }));

    try {
      const options: TranscriptionOptions = {
        modelId: transcriptionOptions.modelId,
        timestampsGranularity: transcriptionOptions.timestampsGranularity,
        tagAudioEvents: transcriptionOptions.tagAudioEvents,
        diarize: transcriptionOptions.diarize,
      };

      if (transcriptionOptions.numSpeakers) {
        options.numSpeakers = transcriptionOptions.numSpeakers;
      }

      if (
        transcriptionOptions.languageCode &&
        transcriptionOptions.languageCode.trim() !== ""
      ) {
        options.languageCode = transcriptionOptions.languageCode.trim();
      }

      const startTime = performance.now();
      const result = await createTranscription({
        file: audio.file,
        ...options,
      });
      const endTime = performance.now();
      const processingTimeMs = endTime - startTime;

      if (result.ok) {
        const words = Array.isArray(result.value.words)
          ? result.value.words
          : [];
        const wordGroups = transcriptionOptions.diarize
          ? groupWordsBySpeaker(words)
          : [];

        setTranscription({
          data: { ...result.value, processingTimeMs } as TranscriptionResult,
          wordGroups: wordGroups,
          isProcessing: false,
        });

        toast.success("Audio transcribed successfully");
        setViewState("result");
      } else {
        toast.error(result.error || "Failed to transcribe audio");
        setTranscription((prev) => ({ ...prev, isProcessing: false }));
      }
    } catch (error) {
      console.error("Transcription error:", error);
      toast.error("An error occurred during transcription");
      setTranscription((prev) => ({ ...prev, isProcessing: false }));
    }
  }, [audio.file, transcriptionOptions]);

  const resetToUpload = useCallback(() => {
    setViewState("upload");

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

  useEffect(() => {
    return () => {
      if (audio.url) URL.revokeObjectURL(audio.url);
    };
  }, [audio.url]);

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
        <FileUpload
          file={audio.file}
          onFileChange={handleFileChange}
          disabled={transcription.isProcessing}
        />

        <AdvancedSettings
          options={transcriptionOptions}
          onChange={setTranscriptionOptions}
        />

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
        <AudioPlayer
          url={audio.url}
          onPlayStateChange={(isPlaying) =>
            setAudio((prev) => ({ ...prev, isPlaying }))
          }
          onTimeUpdate={(currentTime) =>
            setAudio((prev) => ({ ...prev, currentTime }))
          }
          onAudioRef={(ref) => (audioRef.current = ref)}
        />

        <TranscriptionResults
          data={transcription.data}
          wordGroups={transcription.wordGroups}
          options={transcriptionOptions}
          audioCurrentTime={audio.currentTime}
          onSeekToTime={seekToTime}
        />
      </div>
    </div>
  );

  return (
    <div className="container mx-auto max-w-5xl py-4">
      {viewState === "upload" ? renderUploadView() : renderResultView()}
    </div>
  );
}
