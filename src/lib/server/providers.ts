import "server-only";

import { encouragementForPhraseMatch } from "@/lib/reply-encouragement";
import { availableProviderNames, providerAvailabilityFromEnvironment, selectConfiguredProvider } from "@/lib/provider-config";
import type { AiProvider, PhraseExtractionResult, ReplyProcessingResult, TranscriptSegment, TranscriptionInput } from "@/lib/types";

type JsonSchema = Record<string, unknown>;

function runtimeProviderEnvironment() {
  return { OPENAI_API_KEY: process.env.OPENAI_API_KEY, GEMINI_API_KEY: process.env.GEMINI_API_KEY };
}

export interface ReasoningProvider {
  phraseExtraction(segments: TranscriptSegment[], comprehensionLevel: string): Promise<PhraseExtractionResult>;
  replyMatch(targetPhrase: string, transcription: string): Promise<ReplyProcessingResult>;
}

export interface TranscriptionProvider {
  transcribeAudio(input: TranscriptionInput): Promise<TranscriptSegment[]>;
}

export type ModelProvider = ReasoningProvider & TranscriptionProvider & { providerUsed: AiProvider };

const phraseSchema = {
  type: "object", additionalProperties: false,
  required: ["child_translation", "phrase_card"],
  properties: {
    child_translation: { type: "string" },
    phrase_card: {
      type: "object", additionalProperties: false,
      required: ["source_segment_id", "source_timestamp_ms", "original_phrase", "child_friendly_meaning", "pronunciation_guide", "cultural_context"],
      properties: {
        source_segment_id: { type: "string" }, source_timestamp_ms: { type: "number" },
        original_phrase: { type: "string" }, child_friendly_meaning: { type: "string" },
        pronunciation_guide: { type: "string" }, cultural_context: { type: ["string", "null"] },
      },
    },
  },
};

const phraseInstruction = `You create one child-friendly translation and exactly one language-learning phrase card from already-transcribed family voice-note text. Return only the supplied JSON schema.

Rules:
- The original_phrase must be a verbatim or near-verbatim excerpt of the selected source segment. Never invent it.
- Select exactly one phrase, not a list.
- Calibrate child_translation and child_friendly_meaning to the given comprehension level.
- pronunciation_guide is transliteration text only. Never evaluate pronunciation.
- cultural_context is null unless the speaker explicitly names or references a concrete cultural item in the supplied segment, such as a named festival, dish, or relative title. Never infer, generalize, or add background knowledge. Null is a correct and common answer.

Examples:
1) Segment: "I went to the park after school." -> cultural_context: null.
2) Segment: "For Pongal, we cooked pongal with Paati." -> cultural_context may describe only that the speaker explicitly mentioned Pongal, the dish, and Paati. Do not add unstated facts.
Do not use raw audio; only reason over the provided text.`;

const replySchema = {
  type: "object", additionalProperties: false,
  required: ["attempted_phrase_match", "encouragement_text", "translated_for_grandparent"],
  properties: {
    attempted_phrase_match: { type: "string", enum: ["exact", "partial", "not_attempted"] },
    encouragement_text: { type: "string" }, translated_for_grandparent: { type: "string" },
  },
};

const replyInstruction = `You process an already-transcribed child's reply to a family member. Return only the supplied JSON schema.
- Judge only whether the target phrase, or a recognizable text variant, appears in the transcription.
- exact means the target phrase appears; partial means a recognizable part/variant appears; not_attempted means it does not.
- Never assess pronunciation, phonetics, accent, fluency, audio quality, or effort.
- encouragement_text must be warm and non-judgmental. Do not evaluate the child's speech, greeting, wording, effort, or manners beyond phrase presence. Do not use score, grade, correct/incorrect, pass/fail, pronunciation, good, bad, polite, or perfect language.
- translated_for_grandparent translates the child’s transcribed reply. Do not use or request raw audio.`;

type PhrasePayload = { child_translation: string; phrase_card: { source_segment_id: string; source_timestamp_ms: number; original_phrase: string; child_friendly_meaning: string; pronunciation_guide: string; cultural_context: string | null } };
type ReplyPayload = { attempted_phrase_match: ReplyProcessingResult["attemptedPhraseMatch"]; encouragement_text: string; translated_for_grandparent: string };

function phraseResult(payload: PhrasePayload, providerUsed: AiProvider): PhraseExtractionResult {
  return {
    childTranslation: payload.child_translation,
    phraseCard: {
      sourceSegmentId: payload.phrase_card.source_segment_id,
      sourceTimestampMs: payload.phrase_card.source_timestamp_ms,
      originalPhrase: payload.phrase_card.original_phrase,
      childFriendlyMeaning: payload.phrase_card.child_friendly_meaning,
      pronunciationGuide: payload.phrase_card.pronunciation_guide,
      culturalContext: payload.phrase_card.cultural_context,
      providerUsed,
    },
  };
}

function replyResult(payload: ReplyPayload, providerUsed: AiProvider): ReplyProcessingResult {
  return {
    attemptedPhraseMatch: payload.attempted_phrase_match,
    encouragementText: encouragementForPhraseMatch(payload.attempted_phrase_match),
    translatedForGrandparent: payload.translated_for_grandparent,
    providerUsed,
  };
}

function requireKey(name: "OPENAI_API_KEY" | "GEMINI_API_KEY") {
  const key = process.env[name];
  if (!key) throw new Error(`${name} is not configured.`);
  return key;
}

async function openAiJson<T>(body: unknown) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${requireKey("OPENAI_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error("OpenAI could not process this request.");
  const payload = await response.json() as { output_text?: string };
  if (!payload.output_text) throw new Error("OpenAI returned an empty response.");
  return JSON.parse(payload.output_text) as T;
}

const openAiProvider: ModelProvider = {
  providerUsed: "openai",
  async transcribeAudio(input) {
    const formData = new FormData();
    formData.append("file", input.audio, "voice-note.webm");
    formData.append("model", "gpt-4o-transcribe-diarize");
    formData.append("response_format", "diarized_json");
    formData.append("language", "ta");
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST", headers: { Authorization: `Bearer ${requireKey("OPENAI_API_KEY")}` }, body: formData,
    });
    if (!response.ok) throw new Error("OpenAI could not transcribe this note.");
    const payload = await response.json() as { segments?: Array<{ start?: number; end?: number; text?: string }>; text?: string };
    const sourceSegments = payload.segments ?? (payload.text ? [{ start: 0, end: 0, text: payload.text }] : []);
    return sourceSegments.filter((segment) => segment.text).map((segment, index) => ({
      id: `${input.exchangeId}-segment-${index}`, exchangeId: input.exchangeId,
      startMs: Math.round((segment.start ?? 0) * 1000), endMs: Math.round((segment.end ?? 0) * 1000),
      textOriginal: segment.text!.trim(), speaker: "grandparent" as const,
    }));
  },
  async phraseExtraction(segments, comprehensionLevel) {
    const payload = await openAiJson<PhrasePayload>({
      model: "gpt-5.6-terra", store: false, reasoning: { effort: "low" },
      input: [{ role: "developer", content: phraseInstruction }, { role: "user", content: JSON.stringify({ transcript_segments: segments, comprehension_level: comprehensionLevel }) }],
      text: { format: { type: "json_schema", name: "anbuloop_phrase_card", strict: true, schema: phraseSchema } },
    });
    return phraseResult(payload, "openai");
  },
  async replyMatch(targetPhrase, transcription) {
    const payload = await openAiJson<ReplyPayload>({
      model: "gpt-5.6-terra", store: false, reasoning: { effort: "low" },
      input: [{ role: "developer", content: replyInstruction }, { role: "user", content: JSON.stringify({ target_phrase: targetPhrase, reply_transcription: transcription }) }],
      text: { format: { type: "json_schema", name: "anbuloop_reply_attempt", strict: true, schema: replySchema } },
    });
    return replyResult(payload, "openai");
  },
};

async function geminiJson<T>(instruction: string, parts: Array<Record<string, unknown>>, schema: JsonSchema) {
  const model = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": requireKey("GEMINI_API_KEY") },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: instruction }] }, contents: [{ role: "user", parts }], generationConfig: { responseMimeType: "application/json", responseJsonSchema: schema } }),
  });
  if (!response.ok) throw new Error("Gemini could not process this request.");
  const payload = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
  if (!text) throw new Error("Gemini returned an empty response.");
  return JSON.parse(text) as T;
}

const geminiTranscriptionSchema = {
  type: "object", additionalProperties: false, required: ["transcript_segments"],
  properties: { transcript_segments: { type: "array", items: { type: "object", additionalProperties: false, required: ["start_ms", "end_ms", "text_original", "speaker"], properties: { start_ms: { type: "number" }, end_ms: { type: "number" }, text_original: { type: "string" }, speaker: { type: "string", enum: ["grandparent"] } } } } },
};

const geminiProvider: ModelProvider = {
  providerUsed: "gemini",
  async transcribeAudio(input) {
    if (input.audio.size > 10 * 1024 * 1024) throw new Error("For Gemini development mode, use an audio note under 10 MB.");
    const bytes = Buffer.from(await input.audio.arrayBuffer()).toString("base64");
    // Gemini audio understanding is not a drop-in equivalent to OpenAI's dedicated diarization endpoint.
    // Timestamp precision and speaker separation may differ and have not received equivalent validation.
    const payload = await geminiJson<{ transcript_segments: Array<{ start_ms: number; end_ms: number; text_original: string }> }>(
      `Transcribe this short, single-speaker voice note into timestamped segments. Return only the supplied JSON schema.
- Preserve spoken Tamil and any English or Hindi code-switching verbatim; do not translate, normalize, or silently omit code-switched words.
- The speaker is grandparent for every segment.
- Timestamps are approximate milliseconds from the beginning of the recording.
- Do not infer speech that is not audible.`,
      [{ text: "Transcribe this Tamil family voice note." }, { inlineData: { mimeType: input.audio.type || "audio/webm", data: bytes } }],
      geminiTranscriptionSchema,
    );
    return payload.transcript_segments.filter((segment) => segment.text_original.trim()).map((segment, index) => ({
      id: `${input.exchangeId}-segment-${index}`, exchangeId: input.exchangeId, startMs: Math.round(segment.start_ms), endMs: Math.round(segment.end_ms), textOriginal: segment.text_original.trim(), speaker: "grandparent" as const,
    }));
  },
  async phraseExtraction(segments, comprehensionLevel) {
    const payload = await geminiJson<PhrasePayload>(phraseInstruction, [{ text: JSON.stringify({ transcript_segments: segments, comprehension_level: comprehensionLevel }) }], phraseSchema);
    return phraseResult(payload, "gemini");
  },
  async replyMatch(targetPhrase, transcription) {
    const payload = await geminiJson<ReplyPayload>(replyInstruction, [{ text: JSON.stringify({ target_phrase: targetPhrase, reply_transcription: transcription }) }], replySchema);
    return replyResult(payload, "gemini");
  },
};

export function availableProviders(env = runtimeProviderEnvironment()) {
  return availableProviderNames(env);
}

export function selectProviderName(requested: unknown, env = runtimeProviderEnvironment()): AiProvider | null {
  return selectConfiguredProvider(requested, env);
}

export function providerAvailability(env = runtimeProviderEnvironment()) {
  return providerAvailabilityFromEnvironment(env);
}

export function resolveProvider(requested?: unknown, env = runtimeProviderEnvironment()): ModelProvider | null {
  const selected = selectProviderName(requested, env);
  if (selected === "openai") return openAiProvider;
  if (selected === "gemini") return geminiProvider;
  return null;
}
