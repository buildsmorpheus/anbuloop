import { demoState } from "@/lib/fixtures";
import type { AnbuLoopState, Consent, Exchange, PhraseCard, ReplyAttempt, VocabularyItem } from "@/lib/types";

export function memberHasProcessingConsent(consent: Consent | undefined) {
  return Boolean(consent && consent.audioStorageAllowed && consent.translationProcessingAllowed && !consent.revokedAt);
}

export function canProcessExchange(state: AnbuLoopState, exchange: Pick<Exchange, "senderMemberId" | "recipientMemberId">) {
  return [exchange.senderMemberId, exchange.recipientMemberId]
    .every((memberId) => memberHasProcessingConsent(state.consents.find((consent) => consent.memberId === memberId)));
}

export function deleteExchangeFromState(state: AnbuLoopState, exchangeId: string): AnbuLoopState {
  const deletedPhraseCardIds = new Set(state.phraseCards.filter((item) => item.exchangeId === exchangeId).map((item) => item.id));
  return {
    ...state,
    exchanges: state.exchanges.filter((exchange) => exchange.id !== exchangeId),
    transcriptSegments: state.transcriptSegments.filter((segment) => segment.exchangeId !== exchangeId),
    childTranslations: state.childTranslations.filter((item) => item.exchangeId !== exchangeId),
    phraseCards: state.phraseCards.filter((item) => item.exchangeId !== exchangeId),
    replyAttempts: state.replyAttempts.filter((item) => item.exchangeId !== exchangeId),
    vocabularyItems: state.vocabularyItems.map((item) => ({ ...item, linkedPhraseCardIds: item.linkedPhraseCardIds.filter((id) => !deletedPhraseCardIds.has(id)) })).filter((item) => item.linkedPhraseCardIds.length > 0),
  };
}

export function normalizePhrase(value: string) {
  return value.normalize("NFC").toLocaleLowerCase().replace(/[\p{P}\p{S}\s]/gu, "");
}

export function isPhraseTraceable(card: Pick<PhraseCard, "originalPhrase" | "sourceSegmentId">, state: AnbuLoopState) {
  const source = state.transcriptSegments.find((segment) => segment.id === card.sourceSegmentId);
  return Boolean(source && normalizePhrase(source.textOriginal).includes(normalizePhrase(card.originalPhrase)));
}

export function masteredStateFor(attemptCount: number, recognizedMatchCount: number): VocabularyItem["masteredState"] {
  if (!attemptCount) return "new";
  return recognizedMatchCount >= 3 ? "mastered" : "practicing";
}

export function addPhraseCardToVocabulary(state: AnbuLoopState, childMemberId: string, card: PhraseCard): AnbuLoopState {
  const normalized = normalizePhrase(card.originalPhrase);
  const existing = state.vocabularyItems.find((item) => item.childMemberId === childMemberId && normalizePhrase(item.phrase) === normalized);
  const now = card.createdAt;
  const vocabularyItems: VocabularyItem[] = existing
    ? state.vocabularyItems.map((item) => item.id === existing.id ? { ...item, exposureCount: item.exposureCount + 1, lastUsedAt: now, linkedPhraseCardIds: [...item.linkedPhraseCardIds, card.id] } : item)
    : [...state.vocabularyItems, { id: `vocab-${card.id}`, childMemberId, phrase: card.originalPhrase, childFriendlyMeaning: card.childFriendlyMeaning, exposureCount: 1, attemptCount: 0, matchedCount: 0, lastUsedAt: now, masteredState: "new" as const, linkedPhraseCardIds: [card.id] }];
  return { ...state, vocabularyItems };
}

export function recordReplyAttempt(state: AnbuLoopState, attempt: ReplyAttempt): AnbuLoopState {
  const card = state.phraseCards.find((item) => item.id === attempt.targetPhraseCardId);
  if (!card) return state;
  const normalized = normalizePhrase(card.originalPhrase);
  const vocabularyItems = state.vocabularyItems.map((item) => {
    if (item.childMemberId !== attempt.childMemberId || normalizePhrase(item.phrase) !== normalized) return item;
    const attemptCount = item.attemptCount + 1;
    const matchedCount = item.matchedCount + (attempt.attemptedPhraseMatch === "exact" || attempt.attemptedPhraseMatch === "partial" ? 1 : 0);
    return { ...item, attemptCount, matchedCount, lastUsedAt: attempt.createdAt, masteredState: masteredStateFor(attemptCount, matchedCount) };
  });
  return { ...state, replyAttempts: [...state.replyAttempts, attempt], vocabularyItems };
}

export function cloneDemoState(): AnbuLoopState {
  return structuredClone(demoState);
}

export function ensureDayTwoState(state: Omit<AnbuLoopState, "childTranslations" | "phraseCards" | "vocabularyItems" | "replyAttempts"> & Partial<Pick<AnbuLoopState, "childTranslations" | "phraseCards" | "vocabularyItems" | "replyAttempts">>): AnbuLoopState {
  return {
    ...state,
    childTranslations: Array.isArray(state.childTranslations) ? state.childTranslations : [],
    phraseCards: Array.isArray(state.phraseCards) ? state.phraseCards : [],
    vocabularyItems: Array.isArray(state.vocabularyItems) ? state.vocabularyItems : [],
    replyAttempts: Array.isArray(state.replyAttempts) ? state.replyAttempts : [],
  };
}
