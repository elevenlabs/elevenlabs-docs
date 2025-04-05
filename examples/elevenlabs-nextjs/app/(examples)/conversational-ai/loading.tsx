import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-4 text-2xl font-bold">Conversational AI</h1>
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    </div>
  );
}
