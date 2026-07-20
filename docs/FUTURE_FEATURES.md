# AnbuLoop future features

This document is the product roadmap after the hackathon MVP. Nothing here should be described as current behavior unless it is moved into the README's **What works today** section with tests and a user-facing explanation.

## Product north star

AnbuLoop should help spoken languages travel naturally across generations. A child begins with small, safe exchanges with a grandparent or trusted adult, gradually builds confidence in understanding and speaking, and can eventually learn from trusted tutors and native speakers.

AI should reduce the intimidation of a first reply and guide learning step by step. It must not overstate what it knows about a child, their pronunciation, their safety, or their family relationships.

## 1. Family accounts, roles, and controls

Before expanding the audience, build a real relationship and permission model.

- Family accounts with explicit roles: parent or guardian, child, grandparent or family speaker, tutor, and administrator.
- Parent or guardian approval before a child can communicate with a new adult, tutor, or language partner.
- Per-exchange permissions for who may send, listen to, read transcripts, view translations, or view learning history.
- Consent records that identify what was approved, by whom, for which purpose, and when it can be withdrawn.
- Clear child-facing explanations of what is shared and with whom.
- Family invitations, relationship verification, account recovery, blocked users, and reporting paths.
- Account-level privacy controls, retention periods, export, deletion, and a clear distinction between local and cloud data.
- Production-grade authentication, authorization, encrypted storage, audit logs, and incident-response processes.

## 2. A guided child learning experience

Make the learning flow supportive, gradual, and age-calibrated.

- A parent-selected comprehension level, learning goals, and allowed languages.
- A child-friendly onboarding flow that explains one safe action at a time.
- Word-by-word and phrase-by-phrase guidance: meaning, pronunciation guide, examples, listening practice, and a chance to try a reply.
- Optional slower playback, segment replay, transcript highlighting, transliteration, and translated captions.
- Short comprehension activities based on the actual family note: choose a meaning, arrange words, or respond with a simple phrase.
- A learning path that introduces new phrases slowly, revisits prior phrases, and connects them to real conversations.
- Parent-visible progress and conversation summaries without turning a child's private learning into surveillance.
- Accessibility support for different reading levels, scripts, hearing needs, speech needs, and device constraints.

## 3. Playful, transparent motivation

Use encouragement to invite practice, not to rank children or create pressure.

- Stars or badges for completing clearly explained actions such as listening, trying a phrase, replying, or revisiting a word.
- A visible explanation for every reward: what it recognizes and what it does **not** measure.
- Gentle streaks and milestones that can be paused or reset without penalty.
- Family celebrations around shared exchanges rather than competitive leaderboards.
- Progress views that separate exposure, understanding, attempt, and validated mastery.

Stars must never imply that the system measured pronunciation quality unless a future pronunciation feature has been independently validated for that language, age range, and recording condition.

## 4. Language learning engine

Evolve from one PhraseCard per note into a trustworthy, multilingual learning system.

- Multiple language profiles per learner, with script, dialect, transliteration, and comprehension preferences.
- Vocabulary collections built from consented family exchanges, selected lessons, and tutor content.
- Spaced review based on transparent learner actions and parent-approved goals.
- Child-friendly explanations of grammar and cultural context only when source material supports them.
- Carefully designed code-switching support for real family speech that mixes languages.
- Teacher or parent-created phrase sets for situations such as greetings, food, school, travel, and family events.
- A source trail for every taught phrase: where it came from, its meaning, and whether it was family, tutor, or curriculum content.

## 5. Response validation and AI teaching support

The MVP intentionally checks phrase presence in a transcription only. Future feedback must earn trust before it is presented as learning guidance.

- Keep the current non-judgmental `exact`, `partial`, and `not_attempted` phrase-presence flow as a baseline.
- Build a multilingual evaluation harness using consented or synthetic audio, including code-switching, background noise, different devices, and multiple speakers.
- Evaluate transcription, phrase matching, translation, cultural-context null behavior, and safety wording separately for every provider and language.
- Do not introduce pronunciation, phonetic, fluency, or accent scoring until it has language-specific benchmarks, clear uncertainty handling, user research, and human review.
- Give feedback as next-step help—listen again, try one word, or ask a parent or tutor—rather than a hidden score.
- Make AI uncertainty visible and offer a safe correction path when a transcript or translation is wrong.
- Preserve provider traceability so a family can see which system generated a result.

## 6. Trusted tutors and language classes

Once family safeguards and the learning foundation are mature, AnbuLoop can support guided spoken-language learning beyond a family.

- Tutor profiles with language, dialect, availability, teaching style, age-group suitability, and verification status.
- Parent-managed tutor discovery, scheduling, consent, payment, and communication controls.
- Structured one-to-one and small-group spoken-language classes built around short, interactive practice.
- Tutor tools for lesson plans, approved vocabulary, progress summaries, and post-class activities.
- Safety-first live-session controls: guardian visibility, moderation, reporting, and clear communication boundaries.
- Fair payment and payout systems, with transparent fees and local compliance review.

## 7. Opportunity for retired and elderly speakers

AnbuLoop could create meaningful, flexible work for retired native speakers who want to teach the languages and stories they know.

- A separate, opt-in educator pathway rather than automatically treating grandparents as workers.
- Training and onboarding for child-safe teaching and platform tools.
- Support for teachers who prefer low-tech workflows, voice-first interaction, and flexible schedules.
- Fair compensation, accessible support, and dignity-preserving participation.
- Matching based on approved language needs, age suitability, time zones, and parent preferences.

This marketplace direction requires legal, safeguarding, payment, identity, and quality foundations before launch.

## 8. Suggested delivery order

1. Production privacy foundation: authentication, roles, consent lifecycle, secure storage, and deletion.
2. Parent-guided child onboarding and a richer, accessible phrase-learning loop.
3. Multilingual learning profiles, review system, and transparent rewards.
4. Provider and learning-quality evaluation harness; improve transcript and translation reliability first.
5. Carefully tested AI teaching assistance, without unvalidated pronunciation claims.
6. Vetted tutor tools and parent-controlled classes.
7. An opt-in marketplace that creates paid opportunities for retired and elderly language educators.

## Non-negotiable principles

- Consent and child safety come before growth.
- The system must name its provider and disclose uncertainty.
- Source-grounded content beats plausible invention.
- Encouragement is not assessment.
- Family connection and learning value matter more than engagement metrics.
