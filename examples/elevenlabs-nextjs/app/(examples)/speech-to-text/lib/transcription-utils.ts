import * as ElevenLabs from 'elevenlabs/api';

import { WordGroup } from '../components/transcription-results';

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const groupWordsBySpeaker = (
  words: ElevenLabs.SpeechToTextWordResponseModel[]
): WordGroup[] => {
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
