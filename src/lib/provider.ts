import type { AiProvider } from "@/lib/types";

export function providerLabel(provider: AiProvider) {
  return provider === "openai" ? "OpenAI" : "Gemini";
}

export function providerTraceLabel(provider?: AiProvider, isFixture = false) {
  if (provider) return `Provider: ${providerLabel(provider)}`;
  if (isFixture) return "Synthetic fixture — no provider call";
  return "No provider recorded";
}
