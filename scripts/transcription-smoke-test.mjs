import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

const apiKey = process.env.OPENAI_API_KEY;
const audioPath = process.env.ANBULOOP_SMOKE_TEST_AUDIO;

if (!apiKey) {
  console.log("SKIPPED: OPENAI_API_KEY is not configured; fixture mode only.");
  process.exit(0);
}

if (!audioPath) {
  console.error("BLOCKED: Set ANBULOOP_SMOKE_TEST_AUDIO to a short consented or synthetic Tamil audio file.");
  process.exit(1);
}

try {
  const resolvedPath = resolve(audioPath);
  const bytes = await readFile(resolvedPath);
  const formData = new FormData();
  formData.append("file", new Blob([bytes]), basename(resolvedPath));
  formData.append("model", "gpt-4o-transcribe-diarize");
  formData.append("response_format", "diarized_json");
  formData.append("language", "ta");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });
  const payload = await response.json();
  const segmentCount = Array.isArray(payload?.segments) ? payload.segments.length : 0;
  if (!response.ok || !segmentCount) {
    console.error(`FAILED: dedicated transcription endpoint returned status ${response.status} without usable timestamped segments.`);
    process.exit(1);
  }
  console.log(`PASSED: received ${segmentCount} timestamped transcript segment(s). No audio or transcript content was logged.`);
} catch {
  console.error("FAILED: the transcription smoke test could not complete. Check the file format, credentials, and endpoint availability.");
  process.exit(1);
}
