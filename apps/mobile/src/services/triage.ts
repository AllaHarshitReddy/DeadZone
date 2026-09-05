/**
 * Triage service: wrapper around the pure START protocol logic.
 * Runs locally in the browser — no network call needed.
 */

import {
  triage,
  adaptToTriageInput,
  type TriageOutcome,
  TRIAGE_TAG_COLOR,
} from "@sankat-setu/triage";
import type { SOSRequest, VictimVitals, TriageCategory } from "@sankat-setu/schema";

/**
 * Triage an incoming SOS report.
 * Input: civilian's self-reported severity + description
 * Output: START protocol category (immediate/delayed/minor/deceased) + reason
 */
export function triageSOSReport(sos: SOSRequest, vitals?: VictimVitals): {
  category: TriageCategory;
  color: "RED" | "YELLOW" | "GREEN" | "BLACK";
  reasonCode: string;
  reasonText: string;
} {
  // Adapt SOS form data to START protocol inputs
  const adapted = adaptToTriageInput(sos, vitals);

  // Run the triage protocol
  const result = triage(adapted.input);

  return {
    category: result.category,
    color: TRIAGE_TAG_COLOR[result.category],
    reasonCode: result.reasonCode,
    reasonText: result.reasonText,
  };
}

/**
 * Convert TriageCategory to UI-friendly labels.
 */
export function getCategoryLabel(category: TriageCategory): string {
  const labels: Record<TriageCategory, string> = {
    immediate: "IMMEDIATE",
    delayed: "DELAYED",
    minor: "MINOR",
    deceased: "DECEASED",
  };
  return labels[category];
}

/**
 * Get the color for a triage category (for UI rendering).
 */
export function getCategoryColor(category: TriageCategory): string {
  const colors: Record<TriageCategory, string> = {
    immediate: "#E5484D", // RED
    delayed: "#F5A524", // YELLOW
    minor: "#30A46C", // GREEN
    deceased: "#000000", // BLACK
  };
  return colors[category];
}
