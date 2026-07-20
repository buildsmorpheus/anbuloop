export type MemberRole = "grandparent" | "child" | "parent";
export type ComprehensionLevel = "beginner" | "emerging" | "conversational";
export type PreferredScript = "native" | "latin" | "both";
export type ProcessingState = "draft" | "transcribing" | "ready" | "error" | "blocked";
export type AiProvider = "openai" | "gemini";

export interface Family { id: string; name: string; createdAt: string; }
export interface Member {
  id: string; familyId: string; displayName: string; role: MemberRole;
  primaryLanguage: string; secondaryLanguage: string;
}
export interface LanguageProfile {
  memberId: string; comprehensionLevel: ComprehensionLevel;
  preferredScript: PreferredScript; childAge?: number;
}
export interface Consent {
  id: string; memberId: string; audioStorageAllowed: boolean;
  translationProcessingAllowed: boolean; acceptedAt: string; revokedAt?: string;
}
export interface Exchange {
  id: string; familyId: string; senderMemberId: string; recipientMemberId: string;
  audioUrl?: string; localBlobReference?: string; createdAt: string;
  processingState: ProcessingState; isFixture: boolean; fixtureAudioType?: "synthetic" | "consented";
  providerUsed?: AiProvider;
}
export interface TranscriptSegment {
  id: string; exchangeId: string; startMs: number; endMs: number;
  textOriginal: string; speaker: "grandparent";
}
export interface ChildTranslation { exchangeId: string; text: string; createdAt: string; }
export interface PhraseCard {
  id: string; exchangeId: string; sourceSegmentId: string; sourceTimestampMs: number;
  originalPhrase: string; childFriendlyMeaning: string; pronunciationGuide: string;
  culturalContext: string | null; createdAt: string; providerUsed?: AiProvider;
}
export type MasteredState = "new" | "practicing" | "mastered";
export interface VocabularyItem {
  id: string; childMemberId: string; phrase: string; childFriendlyMeaning: string;
  exposureCount: number; attemptCount: number; matchedCount: number; lastUsedAt: string;
  masteredState: MasteredState; linkedPhraseCardIds: string[];
}
export type AttemptedPhraseMatch = "exact" | "partial" | "not_attempted";
export interface ReplyAttempt {
  id: string; exchangeId: string; childMemberId: string; targetPhraseCardId: string;
  audioUrl?: string; localBlobReference?: string; transcription: string;
  attemptedPhraseMatch: AttemptedPhraseMatch; encouragementText: string;
  translatedForGrandparent: string; createdAt: string; isFixture?: boolean; providerUsed?: AiProvider;
}
export interface AnbuLoopState {
  families: Family[]; members: Member[]; languageProfiles: LanguageProfile[];
  consents: Consent[]; exchanges: Exchange[]; transcriptSegments: TranscriptSegment[];
  childTranslations: ChildTranslation[]; phraseCards: PhraseCard[];
  vocabularyItems: VocabularyItem[]; replyAttempts: ReplyAttempt[];
}

export interface TranscriptionInput {
  audio: Blob; language: "ta"; exchangeId: string; provider?: AiProvider;
}
export interface PhraseExtractionResult { childTranslation: string; phraseCard: Omit<PhraseCard, "id" | "exchangeId" | "createdAt">; }
export interface ReplyProcessingResult { attemptedPhraseMatch: AttemptedPhraseMatch; encouragementText: string; translatedForGrandparent: string; providerUsed?: AiProvider; }
export interface ProviderAvailability { availableProviders: AiProvider[]; selectedProvider: AiProvider | null; requiresSelection: boolean; }
