import Link from 'next/link';

import { Logo } from '@/components/logo';
import { Card } from '@/components/ui/card';

export function Byline() {
  return (
    <Card className="border-gradient rounded-lg p-px shadow-lg">
      <div className="bg-card flex flex-col justify-between space-y-3 rounded-lg p-3.5 lg:px-5 lg:py-4">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Logo className="dark:text-white" width={100} />
          </Link>

          <div className="text-sm text-gray-400">
            <a
              className="underline decoration-dotted underline-offset-4 transition-colors hover:text-gray-300"
              href="https://github.com/elevenlabs/elevenlabs-docs/tree/main/examples/elevenlabs-nextjs"
              target="_blank"
              rel="noreferrer"
            >
              View code
            </a>
          </div>
        </div>
      </div>
    </Card>
  );
}
