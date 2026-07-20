"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { cloneDemoState } from "@/lib/domain";
import { clearLocalAudio } from "@/lib/audio-store";
import { clearState, loadState, saveState } from "@/lib/repository";
import type { AnbuLoopState } from "@/lib/types";

type Store = { state: AnbuLoopState; ready: boolean; setState: (state: AnbuLoopState) => void; reset: () => void; };
const StateContext = createContext<Store | null>(null);

export function StateProvider({ children }: { children: React.ReactNode }) {
  // The server cannot read browser localStorage. Start both renders from the same fixture state,
  // then restore browser-local exchanges after hydration to avoid a mismatched initial tree.
  const [state, updateState] = useState<AnbuLoopState>(() => cloneDemoState());
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => { updateState(loadState()); setReady(true); });
    return () => window.cancelAnimationFrame(frame);
  }, []);
  const store = useMemo<Store>(() => ({
    state,
    ready,
    setState(next) { updateState(next); saveState(next); },
    reset() { void clearLocalAudio().catch(() => undefined); clearState(); updateState(loadState()); },
  }), [ready, state]);
  return <StateContext.Provider value={store}>{children}</StateContext.Provider>;
}

export function useAnbuLoop() {
  const context = useContext(StateContext);
  if (!context) throw new Error("useAnbuLoop must be used inside StateProvider");
  return context;
}
