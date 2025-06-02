'use server';

import { createAnthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { PassThrough } from 'stream';
import { z } from 'zod';

import { getApiKey } from '@/app/actions/manage-api-key';
import { handleError } from '@/app/actions/utils';
import { env } from '@/env.mjs';
import { Err, Ok, Result } from '@/types';

export async function createTextToDialogue(
  userPrompt: string,
  selectedVoiceIds: string[]
): Promise<Result<ReadableStream<Uint8Array>>> {
  try {
    const userKeyResult = await getApiKey();
    const userApiKey = userKeyResult.ok ? userKeyResult.value : null;
    const apiKey = userApiKey || env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return Err(
        'API key is missing. Please set your API key in the app or configure the ELEVENLABS_API_KEY environment variable.'
      );
    }

    if (selectedVoiceIds.length === 0) {
      return Err('At least one voice must be selected to generate dialogue.');
    }

    const anthropic = createAnthropic({
      apiKey: env.ANTHROPIC_API_KEY,
    });

    // Create voice assignments for the prompt
    const voiceAssignments = selectedVoiceIds
      .map((voiceId, index) => `Voice ${index + 1}: ${voiceId}`)
      .join('\n');

    const { object } = await generateObject({
      model: anthropic('claude-4-sonnet-20250514'),
      schema: z.object({
        generation: z.array(
          z.object({
            text: z.string(),
            voice_id: z.string(),
          })
        ),
      }),
      prompt: `
Create an engaging dialogue based on this prompt: 

"${userPrompt}"

You have access to these voices:
${voiceAssignments}

INSTRUCTIONS:
1. Create a natural, entertaining piece of audio or dialogue with a few exchanges between characters or if only one voice is selected, a monologue.
2. Use the available voice IDs and assign them to different characters/personalities 
3. Include emotional audio markers in square brackets where appropriate, for example: [laughs], [sighs], [gasps], [whispers], [excited], [annoyed], [confused], [dramatic], [nervous], [cheerful], [sarcastic], [deadpan], etc.
4. The model also supports other markers like: [gunshot], [explosion], [applause], [burp], [humming], [sneezes], [chuckle], [whistles], [claps], [screams], [inhales], [exhales], [sniffs], [claps], [screams], [inhales], [exhales], [applause], [burps], [humming], [sneezes], [chuckle], [whistles] & many more.
4. Make the dialogue feel authentic with natural pauses, interruptions, and emotional reactions
5. Text segments and dialogue should be short & engaging. Ideally 10 seconds of audio in total or less.
6. Vary the voice assignments to create distinct characters
7. The dialogue can be in any language that fits the prompt
8. Include personality quirks and speech patterns that match the audio markers
9. Make it entertaining and engaging - think of it as a mini performance

EXAMPLES of good dialogue segments with audio markers:
- "[excited] Wait, wait, wait! You're telling me you've never tried pizza before?!"
- "[deadpan] Oh great. Another one of your 'brilliant' ideas."
- "[whispers] Psst... I think someone's listening..."
- "[dramatic] This changes EVERYTHING!"
- "[nervous] Uh, are you absolutely sure this is safe?"

Create a complete dialogue/monologue scene that brings the prompt to life.`,
    });

    const requestBody = {
      inputs: object.generation.map((item) => ({
        text: item.text,
        voice_id: item.voice_id,
      })),
    };

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-dialogue`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      return Err(`API request failed: ${response.status} ${response.statusText}`);
    }

    if (!response.body) {
      return Err('No response body received from API');
    }

    const passThrough = new PassThrough();

    (async () => {
      try {
        const reader = response.body!.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          passThrough.write(value);
        }
        passThrough.end();
      } catch (err) {
        passThrough.destroy(err instanceof Error ? err : new Error(String(err)));
      }
    })();

    const webStream = new ReadableStream<Uint8Array>({
      start(controller) {
        passThrough.on('data', (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk));
        });
        passThrough.on('end', () => {
          controller.close();
        });
        passThrough.on('error', (err) => {
          controller.error(err);
        });
      },
      cancel() {
        passThrough.destroy();
      },
    });

    return Ok(webStream);
  } catch (error) {
    return handleError(error, 'create text to dialogue');
  }
}
