import { z } from "zod";
import type { TriageCategory } from "@deadzone/schema";

/**
 * The START (Simple Triage and Rapid Treatment) mass-casualty protocol.
 *
 * Pure deterministic branching, evaluated in this exact fixed order:
 *
 *   1. canWalk                                -> minor    (GREEN)
 *   2. not breathing after airway reposition  -> deceased (BLACK)
 *   3. respiratoryRate > 30                   -> immediate (RED)
 *   4. capillaryRefillSec > 2                 -> immediate (RED)
 *   5. cannot follow commands                 -> immediate (RED)
 *   6. otherwise                              -> delayed  (YELLOW)
 *
 * No LLM, no scoring, no heuristics live here — see CLAUDE.md:
 * "Life-critical decisions never touch the LLM." Every result carries a
 * machine-readable reasonCode and a human reasonText so the decision can
 * be explained and challenged after the fact.
 *
 * `category` reuses TriageCategorySchema from packages/schema (immediate /
 * delayed / minor / deceased) instead of inventing a second RED/YELLOW/
 * GREEN/BLACK enum for the same concept — packages/schema is the contract.
 * TRIAGE_TAG_COLOR below maps back to the familiar tag colours for
 * UI/demo copy that wants them.
 */

export const TriageInputSchema = z.object({
  /** Can the victim get up and walk unaided, right now? */
  canWalk: z.boolean(),
  /** Breathing status AFTER an airway-reposition attempt (head-tilt/chin-lift). */
  isBreathing: z.boolean(),
  /** Breaths per minute. Only evaluated when isBreathing is true. */
  respiratoryRate: z.number().nonnegative(),
  /** Capillary refill time in seconds (nail-bed press test). */
  capillaryRefillSec: z.number().nonnegative(),
  /** Can the victim follow a simple command ("squeeze my hand")? */
  canFollowCommands: z.boolean(),
});
export type TriageInput = z.infer<typeof TriageInputSchema>;

export interface TriageOutcome {
  category: TriageCategory;
  reasonCode: string;
  reasonText: string;
}

export const TRIAGE_TAG_COLOR: Record<TriageCategory, "GREEN" | "YELLOW" | "RED" | "BLACK"> = {
  minor: "GREEN",
  delayed: "YELLOW",
  immediate: "RED",
  deceased: "BLACK",
};

export function triage(input: TriageInput): TriageOutcome {
  const parsed = TriageInputSchema.parse(input);

  if (parsed.canWalk) {
    return {
      category: "minor",
      reasonCode: "CAN_WALK",
      reasonText: "Victim is able to get up and walk unaided.",
    };
  }

  if (!parsed.isBreathing) {
    return {
      category: "deceased",
      reasonCode: "APNEA_AFTER_REPOSITION",
      reasonText: "Victim is not breathing even after an airway-reposition attempt.",
    };
  }

  if (parsed.respiratoryRate > 30) {
    return {
      category: "immediate",
      reasonCode: "RESP_GT_30",
      reasonText: `Respiratory rate of ${parsed.respiratoryRate}/min exceeds the 30/min threshold.`,
    };
  }

  if (parsed.capillaryRefillSec > 2) {
    return {
      category: "immediate",
      reasonCode: "CAP_REFILL_GT_2S",
      reasonText: `Capillary refill of ${parsed.capillaryRefillSec}s exceeds 2s, indicating poor perfusion.`,
    };
  }

  if (!parsed.canFollowCommands) {
    return {
      category: "immediate",
      reasonCode: "CANNOT_FOLLOW_COMMANDS",
      reasonText: "Victim cannot follow a simple command.",
    };
  }

  return {
    category: "delayed",
    reasonCode: "STABLE_PENDING_TREATMENT",
    reasonText:
      "Victim cannot walk but is breathing at a normal rate, perfusing normally, and can follow commands.",
  };
}
