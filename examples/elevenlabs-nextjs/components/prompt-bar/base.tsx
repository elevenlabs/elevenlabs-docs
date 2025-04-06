'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowUpIcon, Loader2Icon } from 'lucide-react';
import { ReactNode, useState } from 'react';
import { useForm, UseFormReturn, FieldValues, Path, PathValue } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type PromptControlsProps<T extends FieldValues> = {
  form: UseFormReturn<T>;
  isSubmitting: boolean;
};

export type PromptBarProps<T extends z.ZodType> = {
  /** Schema for validating the prompt data */
  schema: T;
  /** Default values for the form fields */
  defaultValues: z.infer<T>;
  /** Primary field name that serves as the main prompt input */
  promptFieldName: keyof z.infer<T> & string;
  /** Placeholder text for the prompt input field */
  placeholder?: string;
  /** Submit button tooltip text */
  submitTooltip?: string;
  /** Custom controls to be displayed on the left side of the input */
  leftControls?: (props: PromptControlsProps<z.infer<T>>) => ReactNode;
  /** Custom controls to be displayed on the right side of the input (before submit button) */
  rightControls?: (props: PromptControlsProps<z.infer<T>>) => ReactNode;
  /** Whether to enable Enter key submission */
  enableEnterSubmit?: boolean;
  /** CSS class to apply to the container */
  className?: string;
  /** Function called when form is submitted and validated */
  onSubmit: (data: z.infer<T>) => Promise<void>;
  /** Function called to clear the form after successful submission (optional) */
  onReset?: () => void;
  /** Indicate if submission is in progress from parent component */
  isLoading?: boolean;
};

export function PromptBar<T extends z.ZodType>({
  schema,
  defaultValues,
  promptFieldName,
  placeholder = 'Type your prompt here...',
  submitTooltip = 'Submit',
  leftControls,
  rightControls,
  enableEnterSubmit = true,
  className,
  onSubmit,
  onReset,
  isLoading,
}: PromptBarProps<T>) {
  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onChange',
  });

  // Make sure the primary field is being watched to detect changes
  const promptValue = form.watch(promptFieldName as Path<z.infer<T>>);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const isProcessing = isLoading !== undefined ? isLoading : isSubmitting;

  const handleSubmit = async (data: z.infer<T>) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);

      // Only reset the text field while preserving all other values
      form.setValue(
        promptFieldName as Path<z.infer<T>>,
        defaultValues[promptFieldName] as PathValue<z.infer<T>, Path<z.infer<T>>>,
        {
          shouldDirty: false,
          shouldTouch: false,
        }
      );

      if (onReset) onReset();
    } catch (err) {
      toast.error(`An unexpected error occurred: ${err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = enableEnterSubmit
    ? (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          if (promptValue && !isProcessing) {
            form.handleSubmit(handleSubmit)();
          }
        }
      }
    : undefined;

  const controlProps: PromptControlsProps<z.infer<T>> = {
    form,
    isSubmitting: isProcessing,
  };

  return (
    <div className={className}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="relative rounded-[24px] border border-white/10 bg-[#2B2B2B]/70 p-2 backdrop-blur-xl">
          <Textarea
            {...form.register(promptFieldName as Path<z.infer<T>>, {
              onChange: (e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${target.scrollHeight}px`;
              },
            })}
            disabled={isProcessing}
            className={cn(
              'placeholder:text-token-text-secondary scrollbar-hide flex max-h-[80vh] w-full rounded-md border-0 bg-transparent px-3 pb-4 pt-3 text-sm focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 max-md:flex-1',
              'resize-none overflow-y-auto overflow-x-hidden',
              'scrollbar-width-none ms-overflow-style-none min-h-[48px]'
            )}
            placeholder={placeholder}
            rows={1}
            style={{
              overflowY: 'auto',
              overflowX: 'hidden',
              overflowWrap: 'break-word',
              resize: 'none',
              minHeight: '48px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              scrollbarColor: 'transparent transparent',
            }}
            onKeyDown={handleKeyDown}
          />

          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">{leftControls && leftControls(controlProps)}</div>

            <div className="flex gap-1.5">
              {rightControls && rightControls(controlProps)}

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      disabled={!promptValue || isProcessing}
                      className="h-[36px] w-[36px] rounded-full bg-white p-1.5 text-zinc-900 hover:bg-white/80"
                      type="submit"
                    >
                      {isProcessing ? (
                        <Loader2Icon className="h-6 w-6 animate-spin" />
                      ) : (
                        <ArrowUpIcon className="h-6 w-6" />
                      )}
                      <span className="sr-only">{submitTooltip}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="border border-white/10 bg-[#2B2B2B] text-white">
                    <p>
                      {submitTooltip} {enableEnterSubmit ? '(Enter)' : ''}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
