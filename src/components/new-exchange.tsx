"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAnbuLoop } from "@/components/state-provider";
import { canProcessExchange } from "@/lib/domain";
import { saveLocalAudio } from "@/lib/audio-store";
import { transcribeAudio, TranscriptionUnavailableError } from "@/lib/transcription";
import { providerLabel } from "@/lib/provider";
import type { AiProvider, Exchange, ProviderAvailability } from "@/lib/types";

export function NewExchange() {
  const { state, setState } = useAnbuLoop();
  const fileInput = useRef<HTMLInputElement>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [file, setFile] = useState<File | Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [permission, setPermission] = useState(false);
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [providerAvailability, setProviderAvailability] = useState<ProviderAvailability | null>(null);
  const [provider, setProvider] = useState<AiProvider | null>(null);
  const grandparent = state.members.find((member) => member.id === "paati");
  const child = state.members.find((member) => member.id === "maya");

  useEffect(() => {
    fetch("/api/providers")
      .then((response) => response.ok ? response.json() as Promise<ProviderAvailability> : null)
      .then((availability) => { setProviderAvailability(availability); if (availability?.selectedProvider) setProvider(availability.selectedProvider); })
      .catch(() => setProviderAvailability({ availableProviders: [], selectedProvider: null, requiresSelection: false }));
  }, []);

  const acceptAudio = (nextFile: File | Blob) => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setFile(nextFile); setAudioUrl(URL.createObjectURL(nextFile)); setStatus(null);
  };
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const nextRecorder = new MediaRecorder(stream);
      chunks.current = [];
      nextRecorder.ondataavailable = (event) => { if (event.data.size) chunks.current.push(event.data); };
      nextRecorder.onstop = () => { stream.getTracks().forEach((track) => track.stop()); acceptAudio(new Blob(chunks.current, { type: nextRecorder.mimeType || "audio/webm" })); };
      recorder.current = nextRecorder; nextRecorder.start(); setRecording(true);
    } catch { setStatus("Microphone access was not available. You can upload an audio file instead."); }
  };
  const stopRecording = () => { recorder.current?.stop(); setRecording(false); };
  const submit = async () => {
    if (!file || !grandparent || !child) return;
    if (!permission) { setStatus("Please confirm permission from everyone recorded before continuing."); return; }
    if (!provider) { setStatus("No live provider is configured. Use the synthetic fixtures, or configure exactly one provider or choose one below."); return; }
    const id = `exchange-${crypto.randomUUID()}`;
    const audioReference = `exchange-audio:${id}`;
    try { await saveLocalAudio(audioReference, file); } catch (error) { setStatus(error instanceof Error ? error.message : "The recording could not be saved in this browser."); return; }
    const exchange: Exchange = { id, familyId: "demo-family", senderMemberId: grandparent.id, recipientMemberId: child.id, audioUrl: audioUrl ?? undefined, localBlobReference: audioReference, createdAt: new Date().toISOString(), processingState: "transcribing", isFixture: false, providerUsed: provider };
    if (!canProcessExchange(state, exchange)) { setStatus("Both participants need active audio-storage and processing consent."); return; }
    setState({ ...state, exchanges: [...state.exchanges, exchange] });
    setStatus(`Sending the audio to ${providerLabel(provider)}…`);
    try {
      const segments = await transcribeAudio({ audio: file, language: "ta", exchangeId: id, provider });
      setState({ ...state, exchanges: [...state.exchanges, { ...exchange, processingState: "ready" }], transcriptSegments: [...state.transcriptSegments, ...segments] });
      window.location.assign(`/exchange/${id}`);
    } catch (error) {
      const message = error instanceof TranscriptionUnavailableError ? error.message : "The note could not be transcribed.";
      setState({ ...state, exchanges: [...state.exchanges, { ...exchange, processingState: "blocked" }] });
      setStatus(message);
    }
  };

  return (
    <main className="app-main max-w-2xl">
      <Link href="/family/demo-family" className="text-sm font-bold text-[var(--clay)]">← Back to family</Link>
      <p className="eyebrow mt-7">New exchange</p><h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em]">Add a short voice note</h1>
      <p className="mt-3 leading-7 text-[var(--muted)]">This Day 1 prototype accepts Tamil audio. It never fabricates a transcript when transcription is unavailable.</p>
      <section className="card mt-7">
        <div className="grid gap-4 sm:grid-cols-2"><div><label className="field-label" htmlFor="sender">From</label><select id="sender" className="field" defaultValue="paati"><option>Paati · Tamil</option></select></div><div><label className="field-label" htmlFor="recipient">For</label><select id="recipient" className="field" defaultValue="maya"><option>Maya · English/Tamil</option></select></div></div>
        <div className="mt-6 rounded-2xl bg-[#fff8eb] p-4"><p className="font-semibold">Choose an audio source</p><p className="mt-1 text-sm text-[var(--muted)]">Audio stays in this browser prototype until a configured provider processes it.</p><div className="mt-4 flex flex-wrap gap-3"><button type="button" className="button button-secondary" onClick={() => fileInput.current?.click()}>Upload audio</button><input ref={fileInput} className="sr-only" type="file" accept="audio/*" onChange={(event) => event.target.files?.[0] && acceptAudio(event.target.files[0])}/>{recording ? <button type="button" className="button button-danger" onClick={stopRecording}>Stop recording</button> : <button type="button" className="button button-primary" onClick={startRecording}>Record in browser</button>}</div>{audioUrl && <audio className="mt-5 w-full" controls src={audioUrl}>Your browser cannot play this audio.</audio>}</div>
        {providerAvailability?.requiresSelection && <label className="mt-6 block"><span className="field-label">Processing provider</span><select className="field mt-2" value={provider ?? ""} onChange={(event) => setProvider(event.target.value as AiProvider)}><option value="" disabled>Choose a configured provider</option>{providerAvailability.availableProviders.map((item) => <option key={item} value={item}>{providerLabel(item)}</option>)}</select><span className="mt-2 block text-sm text-[var(--muted)]">This choice is recorded on the exchange and carried through its PhraseCard and reply.</span></label>}
        {providerAvailability && !providerAvailability.availableProviders.length && <p className="mt-6 rounded-xl bg-[#fff1ec] p-3 text-sm text-[#9a3c2e]">No provider is configured. Fixtures remain available; AnbuLoop will not fabricate a transcript.</p>}
        <label className="mt-6 flex items-start gap-3 rounded-2xl border border-[var(--line)] p-4 text-sm leading-6"><input className="mt-1 size-4 accent-[#b65a42]" type="checkbox" checked={permission} onChange={(event) => setPermission(event.target.checked)}/><span><strong>I have permission from everyone recorded to store and process this voice note.</strong><br />This prototype is not a private production service; use only consented test audio.</span></label>
        {status && <p className="mt-4 rounded-xl bg-[#fff1ec] p-3 text-sm text-[#9a3c2e]" role="status">{status}</p>}
        <button type="button" onClick={submit} disabled={!file || !provider} className="button button-primary mt-6 disabled:cursor-not-allowed disabled:opacity-45">Transcribe voice note <span aria-hidden>→</span></button>
      </section>
    </main>
  );
}
