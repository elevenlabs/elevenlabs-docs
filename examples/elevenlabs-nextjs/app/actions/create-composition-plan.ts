'use server';

import { getElevenLabsClient, handleError } from '@/app/actions/utils';
import { Err, Ok, Result } from '@/types';

export interface CreateCompositionPlanRequest {
  prompt: string;
  musicLengthMs: number;
}

export interface CompositionPlan {
  positiveGlobalStyles: string[];
  negativeGlobalStyles: string[];
  sections: Array<{
    sectionName: string;
    positiveLocalStyles: string[];
    negativeLocalStyles: string[];
    durationMs: number;
    lines: string[];
  }>;
}

export async function createCompositionPlan(
  request: CreateCompositionPlanRequest
): Promise<Result<CompositionPlan>> {
  const clientResult = await getElevenLabsClient();
  if (!clientResult.ok) return Err(clientResult.error);

  try {
    const client = clientResult.value;
    const compositionPlan = await client.music.compositionPlan.create({
      prompt: request.prompt,
      musicLengthMs: request.musicLengthMs,
    });

    return Ok(compositionPlan);
  } catch (error) {
    return handleError(error, 'composition plan generation');
  }
}
