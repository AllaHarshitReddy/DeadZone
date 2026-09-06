import type { SOSRequest, VictimVitals } from "@sankat-setu/schema";
import type { TriageInput } from "./triage";

/**
 * Adapter: SOS report -> START protocol inputs.
 *
 * ============================================================================
 * DEFENSIBILITY NOTE — read before changing anything below
 * ============================================================================
 *
 * START triage (triage.ts) needs five fields: canWalk, isBreathing,
 * respiratoryRate, capillaryRefillSec, canFollowCommands. A civilian filing
 * an SOS from a phone screen can supply almost none of these directly — they
 * are not a trained first responder and the phone has no sensors for
 * breathing rate or perfusion. Every field below is either taken directly
 * from a real observation (when one exists) or *inferred*, and every
 * inference is listed here with its rationale so a reviewer — or a judge
 * asking "how did this SOS get triaged RED?" — can trace the decision back
 * to a stated assumption instead of an opaque score.
 *
 * SCHEMA NOTE: the brief for this adapter referred to SOS-form fields named
 * `peopleCount`, `needs[]` and `severity`. packages/schema — the actual
 * contract (see CLAUDE.md) — has no such fields. The nearest real
 * equivalents on SOSRequestSchema are `victimCount`, `incidentType` +
 * `description`, and `priority`, and this adapter is written against those.
 * Flagging the mismatch here rather than quietly inventing the missing
 * fields, per CLAUDE.md's instruction to flag schema-shaped surprises
 * explicitly.
 *
 * Ground truth beats inference: when a responder has actually assessed the
 * victim and recorded VictimVitals (breathing / ableToWalk / mentalStatus),
 * this adapter uses those fields as-is and skips inference for that field
 * only. `radialPulseDetected` exists on VictimVitalsSchema but is unused
 * here — this adapter follows the capillary-refill variant of START that
 * CLAUDE.md/docs/sprint.md specify, not the radial-pulse variant.
 *
 * Assumptions applied when no direct vitals are available:
 *
 *  1. CANWALK_FROM_PRIORITY
 *     canWalk := priority === "low". Only a self-reported LOW priority is
 *     read as "this person is mobile" — any other priority defaults to "we
 *     cannot confirm ambulation," which sends the victim on for further
 *     evaluation instead of a possibly-wrong GREEN. Biased against
 *     under-triage, per START's own philosophy.
 *
 *  2. BREATHING_DEFAULT_TRUE
 *     isBreathing defaults to true (assume breathing) in every case where no
 *     direct vitals were recorded. Apnea resolves to BLACK (deceased) — the
 *     most severe and *least reversible* classification, and one that removes
 *     the victim from responder allocation entirely (allocate.ts) — so it is
 *     NEVER inferred from indirect signals. Not from priority, not from
 *     incident type, not from the two combined. A "critical drowning" is a
 *     resuscitable presentation far more often than not (cold-water
 *     submersion is the textbook case), and a bystander picking two dropdown
 *     values is not asserting death. Absent breathing is only ever taken
 *     from an explicit description keyword (see #5) or recorded VictimVitals.
 *     A critical drowning still triages RED via the priority-derived
 *     respiratory rate and command-following inferences below — it just
 *     isn't pronounced dead by the form.
 *
 *  3. COMMANDS_FROM_PRIORITY
 *     canFollowCommands := priority !== "critical". A self-reported CRITICAL
 *     SOS is read as "may not be responsive"; anything less urgent defaults
 *     to "can follow commands."
 *
 *  4. RESP_RATE / CAP_REFILL INFERRED FROM PRIORITY
 *     respiratoryRate and capillaryRefillSec have no analogue anywhere in
 *     the current schema — no civilian-facing or responder-facing field
 *     captures either, so these two are *always* inferred, never observed.
 *     A "critical" priority maps to values just past the RED thresholds
 *     (32/min, 3s); anything else maps to normal resting values (20/min,
 *     1s). Only "critical" priority is treated as evidence strong enough to
 *     cross a numeric START threshold — "high" priority is deliberately
 *     left at normal defaults rather than partially elevated, because a
 *     partial bump can never itself cross an exceeds-threshold check and
 *     would just be dead code with a false sense of precision.
 *     TODO(post-sih): calibrate the "high" bucket against real responder
 *     feedback instead of defaulting it to the same outcome as "medium".
 *
 *  5. Free-text `description` keyword scan (small, fixed vocabulary).
 *     A direct phrase in the reporter's own words is stronger evidence than
 *     the coarse priority buckets above, so a small set of high-specificity
 *     phrases can push a field toward MORE urgent — never less — and only
 *     when no direct vitals were supplied for that field:
 *       - "not breathing" / "no pulse"      -> isBreathing = false
 *       - "unconscious" / "unresponsive"    -> canFollowCommands = false
 *
 * None of this runs inside triage() itself — triage() stays pure branching
 * over already-decided booleans/numbers, per CLAUDE.md: "Life-critical
 * decisions never touch the LLM," and, just as important here, never touch
 * fuzzy inference either. All of the guessing is quarantined to this file so
 * it can be inspected, challenged and replaced without touching the
 * protocol.
 * ============================================================================
 */

export interface AdaptedTriageInput {
  input: TriageInput;
  /** Which assumptions above were actually invoked for this SOS. */
  assumptionsApplied: string[];
}

const NOT_BREATHING_PATTERN = /\bnot breathing\b|\bno pulse\b/i;
const UNRESPONSIVE_PATTERN = /\bunconscious\b|\bunresponsive\b/i;

export function adaptToTriageInput(sos: SOSRequest, vitals?: VictimVitals): AdaptedTriageInput {
  const assumptionsApplied: string[] = [];
  const text = sos.description ?? "";

  let canWalk: boolean;
  if (vitals?.ableToWalk !== undefined) {
    canWalk = vitals.ableToWalk;
  } else {
    canWalk = sos.priority === "low";
    assumptionsApplied.push("CANWALK_FROM_PRIORITY");
  }

  let isBreathing: boolean;
  if (vitals?.breathing !== undefined) {
    isBreathing = vitals.breathing;
  } else if (NOT_BREATHING_PATTERN.test(text)) {
    // The only path to inferred apnea: the reporter said so in words.
    isBreathing = false;
    assumptionsApplied.push("BREATHING_FALSE_FROM_DESCRIPTION_KEYWORD");
  } else {
    isBreathing = true;
    assumptionsApplied.push("BREATHING_DEFAULT_TRUE");
  }

  let canFollowCommands: boolean;
  if (vitals?.mentalStatus !== undefined) {
    canFollowCommands = vitals.mentalStatus === "alert";
  } else {
    canFollowCommands = sos.priority !== "critical";
    assumptionsApplied.push("COMMANDS_FROM_PRIORITY");
  }
  if (vitals?.mentalStatus === undefined && UNRESPONSIVE_PATTERN.test(text)) {
    canFollowCommands = false;
    assumptionsApplied.push("COMMANDS_FALSE_FROM_DESCRIPTION_KEYWORD");
  }

  // Never directly observable by a civilian, and no schema field captures
  // either today (see assumption #4 above) — always inferred.
  const respiratoryRate = sos.priority === "critical" ? 32 : 20;
  assumptionsApplied.push("RESP_RATE_INFERRED_FROM_PRIORITY");
  const capillaryRefillSec = sos.priority === "critical" ? 3 : 1;
  assumptionsApplied.push("CAP_REFILL_INFERRED_FROM_PRIORITY");

  return {
    input: { canWalk, isBreathing, respiratoryRate, capillaryRefillSec, canFollowCommands },
    assumptionsApplied,
  };
}
