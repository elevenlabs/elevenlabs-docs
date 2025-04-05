'use client';

import { FileAudio } from 'lucide-react';
import { toast } from 'sonner';

interface FileUploadProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
}

export function FileUpload({ file, onFileChange, disabled = false }: FileUploadProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      if (!selectedFile.type.startsWith('audio/') && !selectedFile.type.startsWith('video/')) {
        toast.error('Please upload an audio or video file');
        return;
      }

      onFileChange(selectedFile);
    }
  };

  return (
    <div className="mb-6">
      <label
        htmlFor="file-upload"
        className={`hover:bg-muted/50 flex h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors ${
          disabled ? 'cursor-not-allowed opacity-70' : ''
        }`}
      >
        <FileAudio className="text-primary/70 mb-4 h-12 w-12" />
        <p className="mb-2 text-center text-lg font-medium">
          {file ? file.name : 'Click to upload audio file'}
        </p>
        {file && (
          <p className="text-muted-foreground text-sm">
            {(file.size / (1024 * 1024)).toFixed(2)} MB
          </p>
        )}
        <input
          id="file-upload"
          type="file"
          accept="audio/*,video/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled}
        />
      </label>
    </div>
  );
}
