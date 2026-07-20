"use client";

import { normalizePhrase } from "@/lib/domain";
import type { AiProvider, PhraseExtractionResult, ReplyProcessingResult, TranscriptSegment } from "@/lib/types";

async function requestJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const payload: unknown = await response.json();
  if (!response.ok) throw new Error(typeof payload === "object" && payload && "error" in payload ? String(payload.error) : "Reasoning could not be completed.");
  return payload as T;
}

export function extractPhraseCard(segments: TranscriptSegment[], comprehensionLevel: string, provider?: AiProvider) {
  return requestJson<PhraseExtractionResult>("/api/phrase-card", { segments, comprehensionLevel, provider });
}

export function processReply(targetPhrase: string, transcription: string, provider?: AiProvider) {
  return requestJson<ReplyProcessingResult>("/api/reply", { targetPhrase, transcription, provider });
}

export function fixtureReplyResult(targetPhrase: string, transcription: string): ReplyProcessingResult {
  const phrase = normalizePhrase(targetPhrase);
  const attempt = normalizePhrase(transcription);
  const attemptedPhraseMatch = attempt.includes(phrase) ? "exact" : attempt.includes(phrase.slice(0, Math.ceil(phrase.length / 2))) ? "partial" : "not_attempted";
  return { attemptedPhraseMatch, encouragementText: attemptedPhraseMatch === "not_attempted" ? "Thank you for sharing your reply. You can listen to the phrase again whenever you want." : "Lovely—your family will be happy to hear your voice.", translatedForGrandparent: "Maya sends you a warm hello." };
}
