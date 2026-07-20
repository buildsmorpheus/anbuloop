import type { ReplyProcessingResult } from "@/lib/types";

export function encouragementForPhraseMatch(match: ReplyProcessingResult["attemptedPhraseMatch"]) {
  if (match === "exact") return "Thanks for sharing your voice. This note includes the phrase you are learning.";
  if (match === "partial") return "Thanks for sharing your voice. This note includes part of the phrase you are learning.";
  return "Thanks for sharing your voice. You can listen to the phrase again whenever you want.";
}
