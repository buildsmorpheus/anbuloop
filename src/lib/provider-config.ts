import type { AiProvider, ProviderAvailability } from "@/lib/types";

export type ProviderEnvironment = { OPENAI_API_KEY?: string; GEMINI_API_KEY?: string };

export function availableProviderNames(env: ProviderEnvironment): AiProvider[] {
  return ([env.OPENAI_API_KEY && "openai", env.GEMINI_API_KEY && "gemini"].filter(Boolean) as AiProvider[]);
}

export function selectConfiguredProvider(requested: unknown, env: ProviderEnvironment): AiProvider | null {
  const available = availableProviderNames(env);
  if ((requested === "openai" || requested === "gemini") && available.includes(requested)) return requested;
  return available.length === 1 ? available[0] : null;
}

export function providerAvailabilityFromEnvironment(env: ProviderEnvironment): ProviderAvailability {
  const availableProviders = availableProviderNames(env);
  return {
    availableProviders,
    selectedProvider: availableProviders.length === 1 ? availableProviders[0] : null,
    requiresSelection: availableProviders.length > 1,
  };
}
