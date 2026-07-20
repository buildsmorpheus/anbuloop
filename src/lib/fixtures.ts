import type { AnbuLoopState } from "@/lib/types";

const createdAt = "2026-07-20T09:00:00.000Z";

export const demoState: AnbuLoopState = {
  families: [{ id: "demo-family", name: "Lakshmi’s family", createdAt }],
  members: [
    { id: "paati", familyId: "demo-family", displayName: "Paati", role: "grandparent", primaryLanguage: "Tamil", secondaryLanguage: "English" },
    { id: "maya", familyId: "demo-family", displayName: "Maya", role: "child", primaryLanguage: "English", secondaryLanguage: "Tamil" },
    { id: "anita", familyId: "demo-family", displayName: "Anita", role: "parent", primaryLanguage: "Tamil", secondaryLanguage: "English" },
  ],
  languageProfiles: [
    { memberId: "maya", comprehensionLevel: "emerging", preferredScript: "both", childAge: 8 },
    { memberId: "paati", comprehensionLevel: "conversational", preferredScript: "native" },
  ],
  consents: [
    { id: "consent-paati", memberId: "paati", audioStorageAllowed: true, translationProcessingAllowed: true, acceptedAt: createdAt },
    { id: "consent-maya", memberId: "maya", audioStorageAllowed: true, translationProcessingAllowed: true, acceptedAt: createdAt },
  ],
  exchanges: [
    { id: "fixture-morning", familyId: "demo-family", senderMemberId: "paati", recipientMemberId: "maya", createdAt, processingState: "ready", isFixture: true, fixtureAudioType: "synthetic" },
    { id: "fixture-rain", familyId: "demo-family", senderMemberId: "paati", recipientMemberId: "maya", createdAt: "2026-07-19T11:00:00.000Z", processingState: "ready", isFixture: true, fixtureAudioType: "synthetic" },
  ],
  transcriptSegments: [
    { id: "morning-1", exchangeId: "fixture-morning", startMs: 0, endMs: 4600, speaker: "grandparent", textOriginal: "காலை வணக்கம் மாயா. இன்று நான் துளசிக்கு தண்ணீர் ஊற்றினேன்." },
    { id: "morning-2", exchangeId: "fixture-morning", startMs: 4800, endMs: 9000, speaker: "grandparent", textOriginal: "நீ பள்ளியில் என்ன செய்தாய் என்று சொல்லு." },
    { id: "rain-1", exchangeId: "fixture-rain", startMs: 0, endMs: 4100, speaker: "grandparent", textOriginal: "இங்கே மழை பெய்கிறது. ஜன்னலருகே உட்கார்ந்து காபி குடித்தேன்." },
    { id: "rain-2", exchangeId: "fixture-rain", startMs: 4400, endMs: 7900, speaker: "grandparent", textOriginal: "உன் வரைபடத்தை எனக்கு காட்ட மறக்காதே." },
  ],
  childTranslations: [
    { exchangeId: "fixture-morning", text: "Good morning, Maya! I watered the tulsi plant today. Tell me what you did at school.", createdAt },
    { exchangeId: "fixture-rain", text: "It is raining here. I had coffee by the window. Please remember to show me your drawing.", createdAt },
  ],
  phraseCards: [
    { id: "phrase-morning", exchangeId: "fixture-morning", sourceSegmentId: "morning-1", sourceTimestampMs: 0, originalPhrase: "காலை வணக்கம்", childFriendlyMeaning: "Good morning", pronunciationGuide: "kaalai vaṇakkam", culturalContext: null, createdAt },
    { id: "phrase-rain", exchangeId: "fixture-rain", sourceSegmentId: "rain-1", sourceTimestampMs: 0, originalPhrase: "மழை பெய்கிறது", childFriendlyMeaning: "It is raining", pronunciationGuide: "mazhai peygiradhu", culturalContext: null, createdAt },
  ],
  vocabularyItems: [
    { id: "vocab-morning", childMemberId: "maya", phrase: "காலை வணக்கம்", childFriendlyMeaning: "Good morning", exposureCount: 1, attemptCount: 0, matchedCount: 0, lastUsedAt: createdAt, masteredState: "new", linkedPhraseCardIds: ["phrase-morning"] },
    { id: "vocab-rain", childMemberId: "maya", phrase: "மழை பெய்கிறது", childFriendlyMeaning: "It is raining", exposureCount: 1, attemptCount: 0, matchedCount: 0, lastUsedAt: createdAt, masteredState: "new", linkedPhraseCardIds: ["phrase-rain"] },
  ],
  replyAttempts: [],
};

export const fixtureEnglishGloss: Record<string, string> = {
  "morning-1": "Good morning, Maya. Today I watered the tulsi plant.",
  "morning-2": "Tell me what you did at school.",
  "rain-1": "It is raining here. I sat by the window and drank coffee.",
  "rain-2": "Do not forget to show me your drawing.",
};
