import { describe, expect, it } from "vitest";
import { providerTraceLabel } from "@/lib/provider";
import { providerAvailabilityFromEnvironment, selectConfiguredProvider } from "@/lib/provider-config";
import type { Exchange, PhraseCard, ReplyAttempt } from "@/lib/types";

describe("provider selection and traceability", () => {
  it("records and displays the provider for OpenAI and Gemini output", () => {
    (["openai", "gemini"] as const).forEach((providerUsed) => {
      const exchange = { providerUsed } satisfies Pick<Exchange, "providerUsed">;
      const phraseCard = { providerUsed } satisfies Pick<PhraseCard, "providerUsed">;
      const replyAttempt = { providerUsed } satisfies Pick<ReplyAttempt, "providerUsed">;
      const displayed = providerUsed === "openai" ? "Provider: OpenAI" : "Provider: Gemini";
      expect(exchange.providerUsed).toBe(providerUsed);
      expect(phraseCard.providerUsed).toBe(providerUsed);
      expect(replyAttempt.providerUsed).toBe(providerUsed);
      expect(providerTraceLabel(exchange.providerUsed)).toBe(displayed);
      expect(providerTraceLabel(phraseCard.providerUsed)).toBe(displayed);
      expect(providerTraceLabel(replyAttempt.providerUsed)).toBe(displayed);
    });
  });

  it("requires a picker only when both configured providers are available", () => {
    expect(providerAvailabilityFromEnvironment({ OPENAI_API_KEY: "openai-key" })).toEqual({ availableProviders: ["openai"], selectedProvider: "openai", requiresSelection: false });
    expect(providerAvailabilityFromEnvironment({ OPENAI_API_KEY: "openai-key", GEMINI_API_KEY: "gemini-key" })).toEqual({ availableProviders: ["openai", "gemini"], selectedProvider: null, requiresSelection: true });
  });

  it("never selects a provider or produces live output when neither key is configured", () => {
    const noKeys = {};
    expect(selectConfiguredProvider("openai", noKeys)).toBeNull();
    expect(selectConfiguredProvider("gemini", noKeys)).toBeNull();
    expect(providerAvailabilityFromEnvironment(noKeys)).toEqual({ availableProviders: [], selectedProvider: null, requiresSelection: false });
  });
});
