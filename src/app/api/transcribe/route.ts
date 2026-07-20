import "server-only";

import { NextResponse } from "next/server";
import { resolveProvider } from "@/lib/server/providers";

export async function POST(request: Request) {
  const formData = await request.formData();
  const audio = formData.get("audio");
  const exchangeId = formData.get("exchangeId");
  const language = formData.get("language");
  const requestedProvider = formData.get("provider");
  if (!(audio instanceof File) || typeof exchangeId !== "string" || language !== "ta") {
    return NextResponse.json({ error: "A Tamil audio file and exchange ID are required." }, { status: 400 });
  }
  const provider = resolveProvider(requestedProvider);
  if (!provider) return NextResponse.json({ error: "No configured transcription provider is available. Fixture mode remains available." }, { status: 503 });

  try {
    const segments = await provider.transcribeAudio({ audio, exchangeId, language: "ta", provider: provider.providerUsed });
    return NextResponse.json({ segments, providerUsed: provider.providerUsed });
  } catch {
    return NextResponse.json({ error: `${provider.providerUsed === "openai" ? "OpenAI" : "Gemini"} could not transcribe this note.` }, { status: 502 });
  }
}
