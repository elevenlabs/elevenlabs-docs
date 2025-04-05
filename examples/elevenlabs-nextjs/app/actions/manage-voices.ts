"use server";

import type {
  GetVoicesResponse,
  AddVoiceResponseModel,
  EditVoiceResponseModel,
  DeleteVoiceResponseModel,
  Voice,
  BodyAddVoiceV1VoicesAddPost,
  BodyEditVoiceV1VoicesVoiceIdEditPost,
  VoiceSettings,
} from "elevenlabs/api";

import { Err, Ok, Result } from "@/types";

import { getElevenLabsClient, handleError } from "@/app/actions/utils";

export async function getVoices(): Promise<Result<GetVoicesResponse>> {
  const clientResult = await getElevenLabsClient();
  if (!clientResult.ok) return Err(clientResult.error);

  try {
    const client = clientResult.value;
    const response = await client.voices.getAll();
    return Ok(response);
  } catch (error) {
    return handleError(error, "voice retrieval");
  }
}

export async function getVoice(voiceId: string): Promise<Result<Voice>> {
  const clientResult = await getElevenLabsClient();
  if (!clientResult.ok) return Err(clientResult.error);

  try {
    const client = clientResult.value;
    const response = await client.voices.get(voiceId);

    if (!response) return Err(`Voice with ID ${voiceId} not found`);
    return Ok(response);
  } catch (error) {
    return handleError(error, `voice retrieval for ${voiceId}`);
  }
}

export async function addVoice(
  request: BodyAddVoiceV1VoicesAddPost
): Promise<Result<AddVoiceResponseModel>> {
  const clientResult = await getElevenLabsClient();
  if (!clientResult.ok) return Err(clientResult.error);

  try {
    const client = clientResult.value;
    const response = await client.voices.add(request);

    return Ok(response);
  } catch (error) {
    return handleError(error, "voice creation");
  }
}

export async function editVoice(
  voiceId: string,
  request: BodyEditVoiceV1VoicesVoiceIdEditPost
): Promise<Result<EditVoiceResponseModel>> {
  const clientResult = await getElevenLabsClient();
  if (!clientResult.ok) return Err(clientResult.error);

  try {
    const client = clientResult.value;
    const response = await client.voices.edit(voiceId, request);

    return Ok(response);
  } catch (error) {
    return handleError(error, `voice edit for ${voiceId}`);
  }
}

export async function deleteVoice(
  voiceId: string
): Promise<Result<DeleteVoiceResponseModel>> {
  const clientResult = await getElevenLabsClient();
  if (!clientResult.ok) return Err(clientResult.error);

  try {
    const client = clientResult.value;
    const response = await client.voices.delete(voiceId);
    return Ok(response);
  } catch (error) {
    return handleError(error, `voice deletion for ${voiceId}`);
  }
}

export async function getDefaultVoiceSettings(): Promise<
  Result<VoiceSettings>
> {
  const clientResult = await getElevenLabsClient();
  if (!clientResult.ok) return Err(clientResult.error);

  try {
    const client = clientResult.value;
    const response = await client.voices.getDefaultSettings();
    return Ok(response);
  } catch (error) {
    return handleError(error, "default voice settings retrieval");
  }
}
