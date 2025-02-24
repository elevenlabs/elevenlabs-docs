'use client';

import { LockOpenIcon, LockClosedIcon, TrashIcon } from '@heroicons/react/24/solid';
import { useState } from 'react';

import { useKey } from '@/components/key-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export const KeyManager = () => {
  const [key, setKey] = useKey();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [inputValue, setInputValue] = useState(key || '');

  const hasChanges = inputValue !== (key || '');

  const handleSave = () => {
    const newKey = inputValue.trim() === '' ? null : inputValue;
    setKey(newKey);
    setIsPopoverOpen(false);
  };

  const handleClear = () => {
    setInputValue('');
    setKey(null);
    setIsPopoverOpen(false);
  };

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" onClick={() => setIsPopoverOpen(true)}>
          <AnimatedLockIcon isLocked={key !== null} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">API Key</h4>
            <p className="text-muted-foreground text-sm">Enter your API key below.</p>
          </div>
          <div className="flex gap-2">
            <Input
              id="apiKey"
              type="password"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1"
              placeholder="Enter API Key"
            />
            <Button variant="ghost" size="icon" onClick={handleClear} title="Clear API Key">
              <TrashIcon />
            </Button>
          </div>
          <Button onClick={handleSave} disabled={!hasChanges}>
            Save Changes
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const AnimatedLockIcon = ({ isLocked }: { isLocked: boolean }) => {
  return (
    <div className="relative h-4 w-4">
      <LockClosedIcon
        className={cn(
          'absolute inset-0 transform transition-all duration-300 ease-in-out',
          isLocked ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'
        )}
      />
      <LockOpenIcon
        className={cn(
          'absolute inset-0 transform transition-all duration-300 ease-in-out',
          !isLocked ? 'rotate-0 opacity-100' : 'rotate-90 opacity-0'
        )}
      />
    </div>
  );
};
