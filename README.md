# AnbuLoop — Hackathon MVP

AnbuLoop is a consent-first prototype for short voice-note exchanges between diaspora children and grandparents who speak different languages.

## What works today

- A typed local model for families, members, language profiles, consent, exchanges, and timestamped transcripts.
- Mobile-friendly demo family, transcript-review, upload, and in-browser recording screens.
- Consent gating before any new audio submission.
- Explicit browser-local deletion for exchanges and demo state.
- Two Tamil transcript fixtures, marked as **synthetic demo fixtures**.
- Swappable server-only `TranscriptionProvider` and `ReasoningProvider` implementations for OpenAI and Gemini.
- The OpenAI path retains its dedicated `gpt-4o-transcribe-diarize` transcription route and GPT-5.6 Responses API reasoning calls with strict structured output.
- The Gemini 3.1 Flash-Lite path uses native audio understanding plus structured JSON for the same browser-facing contracts. It is not a drop-in diarization equivalent.
- Every live exchange, PhraseCard, and reply records and visibly displays the provider that produced it. Synthetic fixtures explicitly say that no provider call occurred.
- Underlying VocabularyItem tracking for phrase exposure and replies.
- A “Words we’re learning together” screen that makes exposure, reply attempts, recognized phrase presence, and source-provider history visible.

## OpenAI Build Week implementation note

**Codex** was used to build and iterate on the application: the typed family-learning data model, consent-gated recording flow, server-only provider abstraction, traceability safeguards, browser-local audio persistence, and the test/build checks.

The repository includes an **OpenAI path** with dedicated `gpt-4o-transcribe-diarize` transcription and GPT-5.6 Responses API structured reasoning for PhraseCard extraction and reply matching. The strict schemas and prompts enforce source-traceable phrases, `null` cultural context unless explicitly supported, and phrase-presence-only replies.

The recorded live demo uses Gemini 3.1 Flash-Lite and labels it visibly in the UI. The OpenAI/GPT-5.6 path has not yet had a recorded live API validation; this project does not claim that Gemini output is GPT-5.6 output. See [Provider validation status](#provider-validation-status--source-of-truth) for the current source of truth.

## Intentional boundaries

- AnbuLoop does not assess pronunciation, phonetics, accents, or fluency.
- It does not use GPT-5.6 to transcribe audio. A dedicated transcription model handles that plumbing.
- It never sends raw audio to GPT-5.6. Audio goes only through the transcription boundary; GPT-5.6 receives already-transcribed text.
- ReplyAttempt evaluates only whether a target phrase appears in the transcription. It does not assess pronunciation, phonetics, accent, fluency, or audio quality.
- Fixture transcript content is synthetic. The browser may offer a device-voice preview, but it is not a real family recording. Replace it before a submission demo with either genuinely consented Tamil notes or clearly labelled synthetic Tamil TTS audio.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000` and choose **Open demo family**.

## AI provider setup

Create a root `.env.local` file with one or both provider keys. Keys are server-only and must never use a `NEXT_PUBLIC_` prefix.

```bash
OPENAI_API_KEY=your_key_here
```

The protected `POST /api/transcribe` route submits consented Tamil audio to `/v1/audio/transcriptions` with:

```text
model=gpt-4o-transcribe-diarize
response_format=diarized_json
language=ta
```

With only one key configured, AnbuLoop selects that provider silently. With both configured, the new-exchange screen shows a small provider picker. The selected provider is locked to that exchange and carried through its live PhraseCard and ReplyAttempt.

With neither key, fixtures continue to work and live routes return no generated output.

### Gemini development mode

For development-only testing, create a Gemini key in Google AI Studio and add this to the root `.env.local` file. Do not put any key in browser code, git, screenshots, or chat.

```bash
GEMINI_API_KEY=your_replacement_key_here
GEMINI_MODEL=gemini-3.1-flash-lite
```

Gemini applies the same product prompts and contracts: cultural context is null unless explicitly supported by the transcript, source phrases must be traceable to the transcript, and ReplyAttempt is phrase-presence-only with no pronunciation scoring. Its transcription mechanism is materially different from OpenAI's dedicated diarization endpoint: timestamp precision and speaker separation can differ. Use only synthetic or explicitly approved audio: Gemini's free tier may use prompts and files to improve Google products.

Before relying on live transcription, run the smoke test with a short, consented or explicitly synthetic Tamil clip; do not use private family audio. The app does not persist that preflight clip.

```bash
ANBULOOP_SMOKE_TEST_AUDIO=path/to/consented-or-synthetic-tamil-audio.wav npm run preflight:transcription
```

The current smoke-test script is OpenAI-specific: it safely skips when no `OPENAI_API_KEY` is configured and logs only pass/fail and a segment count.

## Provider validation status — source of truth

This section is the source of truth for provider-validation claims. Update it in the same change that adds a new live evaluation; do not infer validation from a compiling interface.

- **OpenAI / GPT-5.6:** architecturally implemented, but no live OpenAI API call, code-switched transcription run, or six-branch validation has been recorded in this repository. Do not present this path as fully validated.
- **Gemini 3.1 Flash-Lite reasoning:** live synthetic-text checks previously exercised null and populated cultural-context cases and exact, partial, and not-attempted reply matching. Those checks do not validate Gemini transcription.
- **Gemini 3.1 Flash-Lite transcription:** the project owner manually exercised the live voice-note happy path, producing a transcript and reply result. It has not been evaluated with a consented or clearly labelled synthetic Tamil code-switched clip, nor against a benchmark. Do not present it as equivalent to the OpenAI diarization path or as fully validated.
- **This provider-layer refactor:** performs no new live model calls. Gemini behavior is not assumed to pass merely because the interfaces compile.

## Consent and privacy

This is a hackathon prototype, not a production private-data service. The upload screen requires confirmation that everyone recorded has permitted storage and processing. The delete controls remove browser-local exchange data and transcript state. Production retention, identity, and storage controls are future work.

## Vocabulary rules

- A phrase begins as **new** until a child makes the first reply attempt.
- It becomes **practicing** after that first attempt.
- It becomes **mastered** after three recognized phrase-presence matches (`exact` or `partial`). This is a transparent counter, not a hidden quality score.
- VocabularyItem lookup uses simple normalized-text matching. It is not semantic, fuzzy, or phonetic matching.

## 90-second demo script

1. **0–10 seconds — problem:** “Grandparents and children can exchange voice notes, but a language gap makes everyday replies hard.”
2. **10–25 seconds — consented input:** Record or upload a short, consented or clearly labelled synthetic Tamil note. Show the consent checkbox and the visible provider label.
3. **25–40 seconds — transcript:** Show the timestamped original-language transcript. State the provider shown on screen; do not call Gemini output GPT-5.6.
4. **40–55 seconds — source-grounded learning:** Create the PhraseCard. Point to the original phrase, timestamp, child-friendly meaning, and the explicit-or-null cultural note.
5. **55–70 seconds — reply loop:** Record a child reply. Show that the result reports phrase presence only and never gives a pronunciation score.
6. **70–82 seconds — differentiation:** Open “Words we’re learning together.” Show exposure, attempts, recognized matches, and the visible source provider for a phrase.
7. **82–90 seconds — consent and control:** Show the browser-local deletion control and say that this prototype uses only consented demo audio.

## Submission and roadmap

See [SUBMISSION.md](SUBMISSION.md) for paste-ready hackathon copy, a final recording checklist, and the explicitly future roadmap. The roadmap is not current product behavior.

For the detailed post-hackathon plan, see [docs/FUTURE_FEATURES.md](docs/FUTURE_FEATURES.md). It separates planned family controls, child learning, AI validation, tutors, and the later retired-educator opportunity from the submitted MVP.
