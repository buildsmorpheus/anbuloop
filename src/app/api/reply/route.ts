import "server-only";

import { NextResponse } from "next/server";
import { resolveProvider } from "@/lib/server/providers";

export async function POST(request: Request) {
  const body = await request.json() as { targetPhrase?: string; transcription?: string; provider?: unknown };
  if (typeof body.targetPhrase !== "string" || typeof body.transcription !== "string") {
    return NextResponse.json({ error: "A target phrase and transcription are required." }, { status: 400 });
  }
  const provider = resolveProvider(body.provider);
  if (!provider) return NextResponse.json({ error: "No configured reasoning provider is available. Fixture replies remain available." }, { status: 503 });
  try {
    return NextResponse.json(await provider.replyMatch(body.targetPhrase, body.transcription));
  } catch {
    return NextResponse.json({ error: `${provider.providerUsed === "openai" ? "OpenAI" : "Gemini"} could not process this reply.` }, { status: 502 });
  }
}
