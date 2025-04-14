'use client';

import React from 'react';

import { setApiKey } from '@/app/actions/manage-api-key';

const KeyContext = React.createContext<
  [string | null, React.Dispatch<React.SetStateAction<string | null>>] | undefined
>(undefined);

export function KeyProvider({
  children,
  apiKey,
}: {
  children: React.ReactNode;
  apiKey: string | null;
}) {
  const [key, setKey] = React.useState<string | null>(apiKey);

  React.useEffect(() => {
    if (key !== apiKey) {
      setApiKey(key);
    }
  }, [key, apiKey]);

  return <KeyContext.Provider value={[key, setKey]}>{children}</KeyContext.Provider>;
}

export function useKey() {
  const context = React.useContext(KeyContext);
  if (context === undefined) {
    throw new Error('useKey must be used within a KeyProvider');
  }
  return context;
}
