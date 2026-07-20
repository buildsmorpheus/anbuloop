"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAnbuLoop } from "@/components/state-provider";
import { addPhraseCardToVocabulary, deleteExchangeFromState, isPhraseTraceable, recordReplyAttempt } from "@/lib/domain";
import { fixtureEnglishGloss } from "@/lib/fixtures";
import { deleteLocalAudio, loadLocalAudio, saveLocalAudio } from "@/lib/audio-store";
import { providerLabel, providerTraceLabel } from "@/lib/provider";
import { extractPhraseCard, fixtureReplyResult, processReply } from "@/lib/reasoning";
import { transcribeAudio } from "@/lib/transcription";
import type { PhraseCard, ReplyAttempt } from "@/lib/types";

const time = (milliseconds: number) => `${Math.floor(milliseconds / 60000)}:${String(Math.floor((milliseconds % 60000) / 1000)).padStart(2, "0")}`;

function useStoredAudioUrl(audioReference?: string, isFixture = false) {
  const [storedAudioUrl, setStoredAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    if (isFixture || !audioReference) {
      const frame = window.requestAnimationFrame(() => {
        if (active) setStoredAudioUrl(null);
      });
      return () => {
        active = false;
        window.cancelAnimationFrame(frame);
      };
    }

    void loadLocalAudio(audioReference)
      .then((audio) => {
        if (!active || !audio) return;
        objectUrl = URL.createObjectURL(audio);
        setStoredAudioUrl(objectUrl);
      })
      .catch(() => {
        if (active) setStoredAudioUrl(null);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [audioReference, isFixture]);

  return storedAudioUrl;
}

export function ExchangeDetail({ exchangeId }: { exchangeId: string }) {
  const { state, ready, setState } = useAnbuLoop();
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [replyAudio, setReplyAudio] = useState<Blob | null>(null);
  const [replyAudioUrl, setReplyAudioUrl] = useState<string | null>(null);
  const [recordingReply, setRecordingReply] = useState(false);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const exchange = state.exchanges.find((item) => item.id === exchangeId);
  const segments = useMemo(() => state.transcriptSegments.filter((item) => item.exchangeId === exchangeId), [state.transcriptSegments, exchangeId]);
  const translation = state.childTranslations.find((item) => item.exchangeId === exchangeId);
  const phraseCard = state.phraseCards.find((item) => item.exchangeId === exchangeId);
  const replyAttempt = state.replyAttempts.find((item) => item.exchangeId === exchangeId);
  const child = state.members.find((member) => member.role === "child");
  const audioReference = exchange?.localBlobReference;
  const fixtureExchange = exchange?.isFixture ?? false;
  const storedAudioUrl = useStoredAudioUrl(audioReference, fixtureExchange);
  const storedReplyAudioUrl = useStoredAudioUrl(replyAttempt?.localBlobReference, Boolean(replyAttempt?.isFixture));

  if (!exchange || !child) return <main className="app-main"><Link href="/family/demo-family" className="text-[var(--clay)]">← Back to family</Link><p className="mt-8">{ready ? "This exchange was deleted." : "Restoring this local exchange…"}</p></main>;

  const playFixturePreview = () => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(segments.map((segment) => segment.textOriginal).join(" "));
    utterance.lang = "ta-IN"; utterance.onend = () => setSpeaking(false); setSpeaking(true); window.speechSynthesis.speak(utterance);
  };
  const deleteExchange = () => {
    if (window.confirm("Delete this exchange and its transcript from this browser?")) {
      void deleteLocalAudio(exchange.localBlobReference).catch(() => undefined);
      state.replyAttempts.filter((attempt) => attempt.exchangeId === exchangeId).forEach((attempt) => { void deleteLocalAudio(attempt.localBlobReference).catch(() => undefined); });
      setState(deleteExchangeFromState(state, exchangeId));
    }
  };
  const createPhraseCard = async () => {
    setWorking(true); setMessage(null);
    try {
      const profile = state.languageProfiles.find((item) => item.memberId === child.id);
      const result = await extractPhraseCard(segments, profile?.comprehensionLevel ?? "emerging", exchange.providerUsed);
      if (!result.phraseCard.providerUsed) throw new Error("The provider did not identify itself. Nothing was saved.");
      const card: PhraseCard = { id: `phrase-${crypto.randomUUID()}`, exchangeId, sourceSegmentId: result.phraseCard.sourceSegmentId, sourceTimestampMs: result.phraseCard.sourceTimestampMs, originalPhrase: result.phraseCard.originalPhrase, childFriendlyMeaning: result.phraseCard.childFriendlyMeaning, pronunciationGuide: result.phraseCard.pronunciationGuide, culturalContext: result.phraseCard.culturalContext, createdAt: new Date().toISOString(), providerUsed: result.phraseCard.providerUsed };
      if (!isPhraseTraceable(card, state)) throw new Error("The model returned a phrase that could not be traced to the note. Nothing was saved.");
      const next = addPhraseCardToVocabulary({ ...state, childTranslations: [...state.childTranslations, { exchangeId, text: result.childTranslation, createdAt: card.createdAt }], phraseCards: [...state.phraseCards, card] }, child.id, card);
      setState(next);
    } catch (error) { setMessage(error instanceof Error ? error.message : "PhraseCard generation could not be completed."); }
    finally { setWorking(false); }
  };
  const acceptReplyAudio = (blob: Blob) => {
    if (replyAudioUrl) URL.revokeObjectURL(replyAudioUrl);
    setReplyAudio(blob); setReplyAudioUrl(URL.createObjectURL(blob)); setMessage(null);
  };
  const startReplyRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); const next = new MediaRecorder(stream); chunks.current = [];
      next.ondataavailable = (event) => { if (event.data.size) chunks.current.push(event.data); };
      next.onstop = () => { stream.getTracks().forEach((track) => track.stop()); acceptReplyAudio(new Blob(chunks.current, { type: next.mimeType || "audio/webm" })); };
      recorder.current = next; next.start(); setRecordingReply(true);
    } catch { setMessage("Microphone access was not available for this reply."); }
  };
  const stopReplyRecording = () => { recorder.current?.stop(); setRecordingReply(false); };
  const saveAttempt = async (result: ReturnType<typeof fixtureReplyResult>, transcription: string, isFixture = false) => {
    if (!phraseCard) return;
    const id = `reply-${crypto.randomUUID()}`;
    const audioReference = replyAudio ? `reply-audio:${id}` : undefined;
    if (replyAudio && audioReference) await saveLocalAudio(audioReference, replyAudio);
    const attempt: ReplyAttempt = { id, exchangeId, childMemberId: child.id, targetPhraseCardId: phraseCard.id, audioUrl: replyAudioUrl ?? undefined, localBlobReference: audioReference, transcription, attemptedPhraseMatch: result.attemptedPhraseMatch, encouragementText: result.encouragementText, translatedForGrandparent: result.translatedForGrandparent, createdAt: new Date().toISOString(), isFixture, providerUsed: result.providerUsed };
    setState(recordReplyAttempt(state, attempt));
  };
  const submitRecordedReply = async () => {
    if (!replyAudio || !phraseCard) return;
    setWorking(true); setMessage(null);
    try {
      if (!exchange.providerUsed) throw new Error("This exchange has no recorded provider. Use the synthetic demo reply instead.");
      const replySegments = await transcribeAudio({ audio: replyAudio, language: "ta", exchangeId: `reply-${crypto.randomUUID()}`, provider: exchange.providerUsed });
      const transcription = replySegments.map((segment) => segment.textOriginal).join(" ");
      const result = await processReply(phraseCard.originalPhrase, transcription, exchange.providerUsed);
      if (!result.providerUsed) throw new Error("The provider did not identify itself. Nothing was saved.");
      await saveAttempt(result, transcription);
    } catch (error) { setMessage(error instanceof Error ? error.message : "The reply could not be processed."); }
    finally { setWorking(false); }
  };
  const useFixtureReply = () => {
    if (!phraseCard) return;
    const transcription = `${phraseCard.originalPhrase}, Paati!`;
    void saveAttempt(fixtureReplyResult(phraseCard.originalPhrase, transcription), transcription, true);
  };

  return (
    <main className="app-main">
      <Link href="/family/demo-family" className="text-sm font-bold text-[var(--clay)]">← Back to family</Link>
      <div className="mt-7 flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow">Voice note</p><h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em]">Paati → Maya</h1><p className="mt-2 text-sm text-[var(--muted)]">{providerTraceLabel(exchange.providerUsed, exchange.isFixture)}</p></div><span className="pill">{exchange.isFixture ? `${exchange.fixtureAudioType ?? "demo"} fixture` : exchange.processingState}</span></div>
      <section className="mt-6 grid gap-4 md:grid-cols-[0.85fr_1.15fr]">
        <div className="card"><h2 className="font-semibold">Original voice</h2>{exchange.isFixture ? <><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Synthetic device-voice preview for this demo transcript. Replace it with consented or synthetic Tamil audio before the submission video.</p><button onClick={playFixturePreview} className="button button-primary mt-5">{speaking ? "Playing preview…" : "Play synthetic preview"}</button></> : storedAudioUrl ? <audio className="mt-5 w-full" controls src={storedAudioUrl}>Your browser cannot play this recording.</audio> : <p className="mt-3 text-sm text-[var(--muted)]">This recording is not stored in this browser. Add a new note to keep a playable local copy.</p>}</div>
        <div className="card"><div className="flex justify-between gap-4"><div><h2 className="font-semibold">Original-language transcript</h2><p className="mt-1 text-sm text-[var(--muted)]">Every later PhraseCard stays attached to this source text.</p><p className="mt-1 text-xs font-semibold text-[var(--clay)]">{providerTraceLabel(exchange.providerUsed, exchange.isFixture)}</p></div><span className="text-xs font-bold text-[#4f7f70]">{exchange.processingState}</span></div><ol className="mt-5 space-y-4">{segments.map((segment) => <li key={segment.id} className="border-l-2 border-[var(--sun)] pl-4"><p className="text-xs font-bold text-[var(--clay)]">{time(segment.startMs)}–{time(segment.endMs)}</p><p className="mt-1 text-lg leading-8" lang="ta">{segment.textOriginal}</p>{fixtureEnglishGloss[segment.id] && <p className="mt-1 text-sm text-[var(--muted)]">Optional gloss: {fixtureEnglishGloss[segment.id]}</p>}</li>)}</ol>{!segments.length && <p className="mt-5 text-sm text-[var(--muted)]">No transcript was created.</p>}</div>
      </section>

      {translation && phraseCard ? <section className="mt-4 grid gap-4 md:grid-cols-2"><div className="card"><p className="eyebrow">For Maya</p><h2 className="mt-2 text-xl font-semibold">What Paati said</h2><p className="mt-3 leading-7 text-[var(--muted)]">{translation.text}</p><p className="mt-3 text-xs font-semibold text-[var(--clay)]">{providerTraceLabel(phraseCard.providerUsed, exchange.isFixture)}</p></div><div className="card"><p className="eyebrow">One phrase to try</p><h2 className="mt-2 text-2xl font-semibold" lang="ta">{phraseCard.originalPhrase}</h2><p className="mt-2 font-medium">{phraseCard.childFriendlyMeaning}</p><p className="mt-1 text-sm text-[var(--muted)]">Say it like: {phraseCard.pronunciationGuide}</p><p className="mt-4 rounded-xl bg-[#fff8eb] p-3 text-sm leading-6 text-[var(--muted)]">{phraseCard.culturalContext ? phraseCard.culturalContext : "No cultural note was added: this note did not explicitly name one."}</p><p className="mt-3 text-xs font-semibold text-[var(--clay)]">From {time(phraseCard.sourceTimestampMs)} in Paati’s note · {providerTraceLabel(phraseCard.providerUsed, exchange.isFixture)}</p></div></section> : <section className="mt-4 card"><p className="font-semibold">Create the first PhraseCard</p><p className="mt-1 text-sm text-[var(--muted)]">{exchange.providerUsed ? `${providerLabel(exchange.providerUsed)} reads only the transcript text and returns one source-grounded phrase.` : "A configured provider reads only the transcript text and returns one source-grounded phrase."} Cultural context stays empty unless the note explicitly supports it.</p><button disabled={working || !segments.length || !exchange.providerUsed} onClick={createPhraseCard} className="button button-primary mt-4 disabled:opacity-50">{working ? "Creating…" : "Create PhraseCard"}</button></section>}

      {phraseCard && <section className="mt-4 card"><p className="eyebrow">Reply to Paati</p><h2 className="mt-2 text-xl font-semibold">Try the phrase in your own voice</h2><p className="mt-1 text-sm leading-6 text-[var(--muted)]">AnbuLoop checks only whether the phrase appears in the transcription. It never scores pronunciation, accent, or fluency.</p>{!replyAttempt && <div className="mt-4 flex flex-wrap gap-3">{recordingReply ? <button onClick={stopReplyRecording} className="button button-danger">Stop recording</button> : <button onClick={startReplyRecording} className="button button-secondary">Record your reply</button>}{exchange.isFixture && <button onClick={useFixtureReply} className="button button-primary">Use synthetic demo reply</button>}</div>}{replyAudioUrl && !replyAttempt && <><audio className="mt-4 w-full" controls src={replyAudioUrl}>Your browser cannot play this recording.</audio><button disabled={working} onClick={submitRecordedReply} className="button button-primary mt-4 disabled:opacity-50">{working ? "Processing…" : "Send reply"}</button></>}{replyAttempt && <div className="mt-5 rounded-2xl bg-[#eef7f1] p-4"><p className="font-semibold">{replyAttempt.encouragementText}</p>{storedReplyAudioUrl && <><p className="mt-4 text-sm font-semibold text-[var(--ink)]">Your recorded reply</p><audio className="mt-2 w-full" controls src={storedReplyAudioUrl}>Your browser cannot play this recording.</audio></>}<p className="mt-3 text-sm text-[var(--muted)]">Grandparent translation: {replyAttempt.translatedForGrandparent}</p><p className="mt-3 text-xs text-[#4f7f70]">Phrase presence: {replyAttempt.attemptedPhraseMatch.replace("_", " ")} · {providerTraceLabel(replyAttempt.providerUsed, Boolean(replyAttempt.isFixture))}</p></div>}</section>}
      {message && <p role="status" className="mt-4 rounded-xl bg-[#fff1ec] p-3 text-sm text-[#9a3c2e]">{message}</p>}
      <section className="mt-4 card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">Delete this exchange</p><p className="text-sm text-[var(--muted)]">This removes the local transcript and audio reference; it cannot be undone.</p></div><button onClick={deleteExchange} className="button button-danger">Delete exchange</button></section>
    </main>
  );
}
