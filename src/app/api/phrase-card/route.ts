import "server-only";

import { NextResponse } from "next/server";
import { resolveProvider } from "@/lib/server/providers";
import type { TranscriptSegment } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.json() as { segments?: TranscriptSegment[]; comprehensionLevel?: string; provider?: unknown };
  if (!Array.isArray(body.segments) || !body.segments.length || typeof body.comprehensionLevel !== "string") {
    return NextResponse.json({ error: "Transcript segments and a comprehension level are required." }, { status: 400 });
  }
  const provider = resolveProvider(body.provider);
  if (!provider) return NextResponse.json({ error: "No configured reasoning provider is available. Fixture PhraseCards remain available." }, { status: 503 });
  try {
    return NextResponse.json(await provider.phraseExtraction(body.segments, body.comprehensionLevel));
  } catch {
    return NextResponse.json({ error: `${provider.providerUsed === "openai" ? "OpenAI" : "Gemini"} could not create a PhraseCard.` }, { status: 502 });
  }
}
