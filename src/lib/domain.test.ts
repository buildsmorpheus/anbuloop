import { describe, expect, it } from "vitest";
import { addPhraseCardToVocabulary, canProcessExchange, cloneDemoState, deleteExchangeFromState, ensureDayTwoState, isPhraseTraceable, memberHasProcessingConsent, recordReplyAttempt } from "@/lib/domain";
import { encouragementForPhraseMatch } from "@/lib/reply-encouragement";

describe("AnbuLoop consent and local state", () => {
  it("requires active consent for both exchange participants", () => {
    const state = cloneDemoState();
    expect(canProcessExchange(state, { senderMemberId: "paati", recipientMemberId: "maya" })).toBe(true);
    state.consents[0].revokedAt = "2026-07-20T12:00:00.000Z";
    expect(memberHasProcessingConsent(state.consents[0])).toBe(false);
    expect(canProcessExchange(state, { senderMemberId: "paati", recipientMemberId: "maya" })).toBe(false);
  });

  it("ships timestamped fixture transcripts", () => {
    const state = cloneDemoState();
    expect(state.exchanges.every((exchange) => exchange.isFixture)).toBe(true);
    expect(state.transcriptSegments[0]).toMatchObject({ exchangeId: "fixture-morning", startMs: 0, speaker: "grandparent" });
  });

  it("deletes the exchange and all of its local transcript segments", () => {
    const state = cloneDemoState();
    const next = deleteExchangeFromState(state, "fixture-morning");
    expect(next.exchanges.some((exchange) => exchange.id === "fixture-morning")).toBe(false);
    expect(next.transcriptSegments.some((segment) => segment.exchangeId === "fixture-morning")).toBe(false);
    expect(next.vocabularyItems.some((item) => item.id === "vocab-morning")).toBe(false);
  });

  it("keeps cultural context null when a fixture note does not explicitly supply it", () => {
    const state = cloneDemoState();
    const card = state.phraseCards.find((item) => item.id === "phrase-morning")!;
    expect(card.culturalContext).toBeNull();
    expect(isPhraseTraceable(card, state)).toBe(true);
  });

  it("increments exposure, attempts, matches, and reaches mastery after three recognized matches", () => {
    const state = cloneDemoState();
    const card = state.phraseCards.find((item) => item.id === "phrase-morning")!;
    let next = addPhraseCardToVocabulary(state, "maya", { ...card, id: "phrase-morning-again" });
    expect(next.vocabularyItems.find((item) => item.id === "vocab-morning")?.exposureCount).toBe(2);
    for (let index = 0; index < 3; index += 1) {
      next = recordReplyAttempt(next, { id: `reply-${index}`, exchangeId: "fixture-morning", childMemberId: "maya", targetPhraseCardId: "phrase-morning", transcription: "காலை வணக்கம்", attemptedPhraseMatch: "exact", encouragementText: "Warmly received.", translatedForGrandparent: "Hello.", createdAt: `2026-07-20T09:0${index}:00.000Z` });
    }
    expect(next.vocabularyItems.find((item) => item.id === "vocab-morning")).toMatchObject({ attemptCount: 3, matchedCount: 3, masteredState: "mastered" });
  });

  it("migrates locally persisted Day 1 data without fabricating Day 2 reasoning results", () => {
    const legacy = cloneDemoState();
    const dayOneState = {
      families: legacy.families, members: legacy.members, languageProfiles: legacy.languageProfiles,
      consents: legacy.consents, exchanges: legacy.exchanges, transcriptSegments: legacy.transcriptSegments,
    };
    const migrated = ensureDayTwoState(dayOneState);
    expect(migrated.childTranslations).toEqual([]);
    expect(migrated.phraseCards).toEqual([]);
    expect(migrated.vocabularyItems).toEqual([]);
    expect(migrated.replyAttempts).toEqual([]);
  });

  it("uses neutral encouragement for every phrase-presence outcome", () => {
    expect(encouragementForPhraseMatch("exact")).toBe("Thanks for sharing your voice. This note includes the phrase you are learning.");
    expect(encouragementForPhraseMatch("partial")).toBe("Thanks for sharing your voice. This note includes part of the phrase you are learning.");
    expect(encouragementForPhraseMatch("not_attempted")).toBe("Thanks for sharing your voice. You can listen to the phrase again whenever you want.");
  });
});
