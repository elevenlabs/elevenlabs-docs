'use client';

import { usePathname } from 'next/navigation';

import { Byline } from '@/components/by-line';
import { Card } from '@/components/ui/card';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isElevenLabsV3 = pathname.includes('/elevenlabs-v3');

  if (isElevenLabsV3) {
    return <>{children}</>;
  }

  return (
    <div className="p-4">
      <div className="mx-auto max-w-4xl space-y-3 px-2 pt-20 lg:px-8 lg:py-8">
        <Byline />
        <Card className="border-gradient rounded-lg p-px shadow-lg">
          <div className="bg-card rounded-lg">{children}</div>
        </Card>
      </div>
    </div>
  );
}
