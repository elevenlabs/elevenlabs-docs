'use client';

import { KeyIcon, AlertTriangleIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { useKey } from '@/components/key-provider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ApiKeyBannerProps {
  variant?: 'header' | 'sidebar';
}

export function ApiKeyBanner({ variant = 'header' }: ApiKeyBannerProps) {
  const [key, setKey] = useKey();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(key || '');

  const hasApiKey = key !== null && key !== '';
  const hasChanges = inputValue !== (key || '');

  const handleSave = () => {
    const newKey = inputValue.trim() === '' ? null : inputValue;
    setKey(newKey);
    setIsOpen(false);
  };

  const handleClear = () => {
    setInputValue('');
  };

  // Different styling based on variant
  const buttonClasses =
    variant === 'header'
      ? cn(
          'flex items-center gap-2 rounded-full font-medium transition-all',
          hasApiKey
            ? 'bg-green-600/20 text-green-500 hover:bg-green-600/30'
            : 'bg-red-600/20 text-red-500 hover:bg-red-600/30'
        )
      : cn(
          'flex w-full items-center justify-between rounded font-medium transition-all',
          hasApiKey
            ? 'bg-green-600/10 text-green-500 hover:bg-green-600/20'
            : 'bg-red-600/10 text-red-500 hover:bg-red-600/20'
        );

  return (
    <div className={variant === 'header' ? 'flex items-center' : 'w-full'}>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            className={buttonClasses}
            variant="ghost"
            size={variant === 'header' ? 'sm' : 'default'}
          >
            {hasApiKey ? (
              <>
                <span className="flex items-center gap-2">
                  <KeyIcon className="h-4 w-4" />
                  <span>API Key Set</span>
                </span>
                {variant === 'sidebar' && (
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                )}
              </>
            ) : (
              <>
                <span className="flex items-center gap-2">
                  <AlertTriangleIcon className="h-4 w-4 animate-pulse" />
                  <span>Set API Key</span>
                </span>
                {variant === 'sidebar' && (
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-500"></span>
                )}
              </>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ElevenLabs API Key</DialogTitle>
            <DialogDescription>
              Enter your ElevenLabs API key to access the platform features. You can find your API
              key in your{' '}
              <Link
                href="https://elevenlabs.io/app/settings/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                ElevenLabs account
              </Link>
              .
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="apiKey">API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="apiKey"
                  type="password"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-1"
                  placeholder="Enter your ElevenLabs API key"
                />
                <Button variant="outline" size="icon" onClick={handleClear} title="Clear API Key">
                  <span className="sr-only">Clear</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={!hasChanges}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
