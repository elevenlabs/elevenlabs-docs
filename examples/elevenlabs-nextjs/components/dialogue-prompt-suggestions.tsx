'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircleIcon, PhoneCallIcon, UsersIcon, MicIcon } from 'lucide-react';
import { observer } from 'mobx-react';

import { SuggestionItem } from '@/components/ui/suggestion-item';

const MAX_SUGGESTIONS = 4;

const DIALOGUE_SUGGESTIONS = [
  {
    id: 'haunted-house',
    label: 'Haunted house adventure',
    prompt:
      'Friends exploring a creaky haunted mansion, reacting to spooky sounds and mysterious occurrences with jump scares and nervous laughter',
    icon: <MessageCircleIcon className="h-4 w-4" />,
  },
  {
    id: 'cooking-disaster',
    label: 'Cooking show gone wrong',
    prompt:
      'A confident chef teaching a nervous student, but everything goes hilariously wrong with kitchen disasters, smoke alarms, and culinary chaos',
    icon: <MicIcon className="h-4 w-4" />,
  },
  {
    id: 'sports-commentary',
    label: 'Epic sports moment',
    prompt:
      'Sports commentators calling the final moments of a nail-biting championship game with crowd reactions and dramatic tension',
    icon: <UsersIcon className="h-4 w-4" />,
  },
  {
    id: 'first-date',
    label: 'Awkward first date',
    prompt:
      'A nervous couple on their first coffee date with amusing misunderstandings, awkward silences, and endearing moments',
    icon: <PhoneCallIcon className="h-4 w-4" />,
  },
  {
    id: 'superhero-training',
    label: 'Superhero training day',
    prompt:
      'An experienced superhero mentor training an enthusiastic but clumsy new recruit with action sounds and comedic failures',
    icon: <UsersIcon className="h-4 w-4" />,
  },
  {
    id: 'pet-translator',
    label: 'Pet translator device',
    prompt:
      'A person using a fictional pet translator device for the first time, discovering what their cat or dog really thinks about them',
    icon: <MessageCircleIcon className="h-4 w-4" />,
  },
];

export const DialoguePromptSuggestions = observer(
  ({ handleClick }: { handleClick: (prompt: string) => void }) => {
    const suggestionsToDisplay = DIALOGUE_SUGGESTIONS.slice(0, MAX_SUGGESTIONS);

    return (
      <div className="flex flex-wrap justify-start gap-2">
        {suggestionsToDisplay.map((suggestion, index) => {
          const itemKey = `${suggestion.id}::${suggestion.label}`;
          return (
            <AnimatePresence key={itemKey}>
              <motion.div
                className="flex opacity-0"
                key={itemKey}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.25,
                  delay: index * 0.08 + 0.5,
                  ease: 'easeOut',
                }}
                exit={{
                  opacity: 0,
                  y: 6,
                  transition: { duration: 0.25, ease: 'easeOut' },
                }}
              >
                <SuggestionItem
                  onClick={() => {
                    handleClick(suggestion.prompt);
                  }}
                  icon={suggestion.icon}
                  label={suggestion.label}
                />
              </motion.div>
            </AnimatePresence>
          );
        })}
      </div>
    );
  }
);
