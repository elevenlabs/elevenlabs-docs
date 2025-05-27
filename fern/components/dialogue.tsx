// import * as React from 'react';

interface DialogueItem {
  speaker: string;
  text: string;
}

interface DialogueProps {
  dialogue: DialogueItem[];
  className?: string;
}

export const Dialogue = ({ dialogue, className = '' }: DialogueProps) => {
  // Track unique speakers to assign consistent sides
  const speakers = Array.from(new Set(dialogue.map(item => item.speaker)));

  // Assign speakers to left/right alternating pattern
  const getSpeakerSide = (speaker: string): 'left' | 'right' => {
    const speakerIndex = speakers.indexOf(speaker);
    return speakerIndex % 2 === 0 ? 'left' : 'right';
  };

  return (
    <div className={`max-w-2xl mx-auto p-5 font-sans ${className}`}>
      <div className="flex flex-col gap-4">
        {dialogue.map((item, index) => {
          const side = getSpeakerSide(item.speaker);
          const isLeft = side === 'left';

          return (
            <div
              key={`${item.speaker}-${index}-${item.text.slice(0, 10)}`}
              className={`flex w-full ${isLeft ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`
                  max-w-[70%] px-4 py-3 rounded-2xl relative break-words shadow-sm
                  ${isLeft
                    ? 'bg-gray-100 text-black rounded-bl-sm'
                    : 'bg-black text-white rounded-br-sm'
                  }
                  sm:max-w-[85%] sm:px-3.5 sm:py-2.5
                `}
              >
                <div className="text-xs font-semibold mb-1 opacity-80 sm:text-[11px]">
                  {item.speaker}
                </div>
                <div className="text-sm leading-relaxed sm:text-[13px]">
                  {item.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dialogue;
