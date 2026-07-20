"use client";

import type { TranscriptSegment, TranscriptionInput } from "@/lib/types";

export class TranscriptionUnavailableError extends Error {}

export async function transcribeAudio(input: TranscriptionInput): Promise<TranscriptSegment[]> {
  const formData = new FormData();
  formData.append("audio", input.audio, "voice-note.webm");
  formData.append("exchangeId", input.exchangeId);
  formData.append("language", input.language);
  if (input.provider) formData.append("provider", input.provider);
  const response = await fetch("/api/transcribe", { method: "POST", body: formData });
  const payload: unknown = await response.json();
  if (!response.ok) {
    const message = typeof payload === "object" && payload && "error" in payload ? String(payload.error) : "Transcription could not be completed.";
    throw new TranscriptionUnavailableError(message);
  }
  return (payload as { segments: TranscriptSegment[] }).segments;
}
