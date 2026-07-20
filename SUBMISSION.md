# AnbuLoop — Hackathon submission package

## Paste-ready project details

**Project name:** AnbuLoop

**One-line tagline:** A consent-first voice-note loop that helps children understand, answer, and gradually learn the language of a grandparent they love.

**Track:** Apps for Your Life

**Short description:**

AnbuLoop turns a short, consented voice note from a grandparent into a child-level translation and one source-grounded phrase to try. A child records a reply; the app checks only whether the phrase appears in the transcription—never pronunciation, accent, or fluency—and keeps a transparent history of words they are learning together.

**Long description:**

Everyday voice notes are a warm way for diaspora families to stay close, but a language gap makes a child’s reply feel difficult. AnbuLoop makes a small exchange approachable: a grandparent records a note, the child sees a timestamped original-language transcript, gets a child-friendly translation, and practices one phrase from the actual note. The child can then send a voice reply. AnbuLoop reports phrase presence only, with warm encouragement; it deliberately does not pretend to score pronunciation.

The product is designed around traceability and consent. Each PhraseCard is tied back to its transcript timestamp, cultural context is empty unless the note explicitly supports it, and each live transcript, PhraseCard, and reply visibly names the provider that generated it. Local deletion removes the browser-stored exchange and audio. The “Words we’re learning together” view makes exposure, attempts, and recognized phrase presence visible instead of hiding a progress score behind a black box.

## How it was built

- Next.js and TypeScript interface, built with Codex.
- Browser recording and upload flow, with consent gating before processing.
- Browser-local IndexedDB audio storage so both the grandparent’s note and a child’s completed reply remain playable after navigation and refresh in the same browser.
- Server-side swappable provider layer: `TranscriptionProvider` and `ReasoningProvider` implementations for OpenAI and Gemini.
- A demonstrated Gemini 3.1 Flash-Lite path for native audio understanding and structured phrase/reply processing.
- An implemented OpenAI path using `gpt-4o-transcribe-diarize` for dedicated transcription and GPT-5.6 Responses API structured reasoning for PhraseCard extraction and reply matching.
- Typed models for Family, Member, LanguageProfile, Consent, Exchange, TranscriptSegment, PhraseCard, VocabularyItem, and ReplyAttempt.

## AI safety and product boundaries

- The child-facing PhraseCard must quote a phrase that is traceable to the note.
- Cultural context is `null` unless it is explicitly stated in the note; a plausible guess is not accepted.
- Reply processing checks transcript phrase presence only (`exact`, `partial`, or `not_attempted`); it never grades pronunciation or fluency.
- The active provider is disclosed on every generated result. Synthetic fixtures say that no model call was made.
- This is a hackathon prototype, not a production family-data service. It uses browser-local storage and a simple consent confirmation; account roles, retention, access control, and formal child-safety safeguards remain future work.

## Provider honesty note

Use this wording in the submission if asked about models:

> Codex was used to build AnbuLoop. The recorded live demo uses Gemini 3.1 Flash-Lite, visibly labelled in the product. The OpenAI path—including GPT-5.6 structured reasoning—is implemented behind the same provider interface, but has not yet had a recorded live API validation. We do not present that path as validated or claim that Gemini output is GPT-5.6 output.

Do not write “powered by GPT-5.6” unless a live OpenAI run has been made and recorded before submission.

## Final 90-second recording checklist

1. Start at the family page and state the problem in one sentence.
2. Show the consent checkbox and record or upload a short consented Tamil note.
3. Point to the visible `Provider: Gemini` label and the playable original note.
4. Show its timestamped transcript and create one PhraseCard.
5. Point to the original phrase, child-friendly meaning, source timestamp, and `No cultural note` where the note did not explicitly supply one.
6. Record a child reply, send it, and play the saved reply audio.
7. Say clearly: “This is phrase presence, not pronunciation scoring.”
8. Open Words we’re learning together and show source, attempts, and recognized matches.
9. End on local deletion and the sentence: “The current prototype uses consented demo audio and browser-local storage.”

## Post-hackathon roadmap — not in this submission

1. **Family safety and control:** guardian-managed child accounts; explicit parent, child, grandparent, and tutor permissions; granular sharing; retention controls; export/deletion; and child-safety review.
2. **Guided learning:** age-calibrated, word-by-word help; comprehension checks; playful, transparent progress rewards; and feedback that stays separate from unvalidated pronunciation claims.
3. **A richer learning loop:** multiple source languages, instructor-created lessons, and parent-visible goals built from real exchanges.
4. **Community and livelihoods:** after safety, identity, payment, quality, and safeguarding foundations are in place, invite vetted retired speakers and language tutors to offer paid spoken-language learning sessions.

The north star is not merely translation. It is helping spoken languages travel naturally across generations, with AI making the first reply less intimidating.
