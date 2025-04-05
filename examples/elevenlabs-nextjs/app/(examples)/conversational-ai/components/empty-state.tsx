'use client';

import Image from 'next/image';

import { Button } from '@/components/ui/button';

export default function EmptyState() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-4 text-2xl font-bold">Conversational AI</h1>
      <div className="flex h-80 flex-col items-center justify-center">
        <Image
          src="/empty-folder.png"
          alt="No agents found"
          width={160}
          height={160}
          className="select-none"
          draggable={false}
        />
        <h3 className="mb-2 text-xl font-medium">No agents found</h3>
        <p className="text-muted-foreground text-center">
          Create an agent in the ElevenLabs dashboard
        </p>
        <Button
          onClick={() => window.open('https://elevenlabs.io/app/conversational-ai', '_blank')}
          className="mt-6"
        >
          Create Agent
        </Button>
      </div>
    </div>
  );
}
