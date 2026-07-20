"use client";

import { cloneDemoState, ensureDayTwoState } from "@/lib/domain";
import type { AnbuLoopState } from "@/lib/types";

const storageKey = "anbuloop-state";

function isState(value: unknown): value is AnbuLoopState {
  return Boolean(value && typeof value === "object" && "families" in value && "exchanges" in value && "transcriptSegments" in value);
}

export function loadState(): AnbuLoopState {
  if (typeof window === "undefined") return cloneDemoState();
  try {
    const persisted = window.localStorage.getItem(storageKey);
    if (!persisted) return cloneDemoState();
    const parsed: unknown = JSON.parse(persisted);
    return isState(parsed) ? ensureDayTwoState(parsed) : cloneDemoState();
  } catch { return cloneDemoState(); }
}

export function saveState(state: AnbuLoopState) {
  window.localStorage.setItem(storageKey, JSON.stringify(state));
}

export function clearState() {
  window.localStorage.removeItem(storageKey);
}
