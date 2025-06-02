import { AudioLines, Gem, MessageSquareQuote, MessagesSquare, Sparkles } from 'lucide-react';
import type { ComponentType } from 'react';

type Demo = {
  name: string;
  slug: string;
  disabled?: boolean;
  icon?: ComponentType<{ className?: string }>;
  description?: string;
};

export const demos: { name: string; items: Demo[] }[] = [
  {
    name: 'Capabilities',
    items: [
      {
        name: 'ElevenLabs v3',
        icon: Gem,
        slug: 'elevenlabs-v3',
        description: 'Learn how to build with ElevenLabs v3.',
      },
      {
        name: 'Text to speech',
        icon: MessageSquareQuote,
        slug: 'text-to-speech',
        description: 'Convert text to natural-sounding speech.',
      },
      {
        name: 'Speech to text',
        icon: AudioLines,
        slug: 'speech-to-text',
        description: 'Transcribe audio and video files with high accuracy.',
      },
      {
        name: 'Sound effects',
        icon: Sparkles,
        slug: 'sound-effects',
        description: 'Turn text into cinematic sound effects.',
      },
      {
        name: 'Conversational AI',
        icon: MessagesSquare,
        slug: 'conversational-ai',
        description: 'Build life-like conversational agents.',
      },
    ],
  },
];

export function findDemoBySlug(slug: string): (Demo & { category: string }) | undefined {
  for (const section of demos) {
    const item = section.items.find((item) => item.slug === slug);
    if (item) {
      return { ...item, category: section.name };
    }
  }
  return undefined;
}
