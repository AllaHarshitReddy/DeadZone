import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { SOSRequest, VictimVitals } from "@sankat-setu/schema";
import { adaptToTriageInput } from "./adapter";
import { triage } from "./triage";

function makeSOS(overrides: Partial<SOSRequest> = {}): SOSRequest {
  return {
    id: randomUUID(),
    deviceId: randomUUID(),
    incidentType: "medical",
    priority: "medium",
    victimCount: 1,
    description: "",
    geo: { lat: 12.9352, lng: 77.6245 },
    status: "new",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// --- canWalk -----------------------------------------------------------

test("CANWALK_FROM_PRIORITY: low priority infers canWalk=true", () => {
  const { input, assumptionsApplied } = adaptToTriageInput(makeSOS({ priority: "low" }));
  assert.equal(input.canWalk, true);
  assert.ok(assumptionsApplied.includes("CANWALK_FROM_PRIORITY"));
});

test("CANWALK_FROM_PRIORITY: any non-low priority infers canWalk=false", () => {
  for (const priority of ["critical", "high", "medium"] as const) {
    const { input } = adaptToTriageInput(makeSOS({ priority }));
    assert.equal(input.canWalk, false, `priority=${priority}`);
  }
});

test("direct victim vitals override the canWalk inference", () => {
  const vitals: VictimVitals = { ableToWalk: true };
  const { input, assumptionsApplied } = adaptToTriageInput(makeSOS({ priority: "critical" }), vitals);
  assert.equal(input.canWalk, true);
  assert.ok(!assumptionsApplied.includes("CANWALK_FROM_PRIORITY"));
});

// --- isBreathing ---------------------------------------------------------

test("BREATHING default: assumed true for a non-drowning critical SOS", () => {
  const { input, assumptionsApplied } = adaptToTriageInput(
    makeSOS({ priority: "critical", incidentType: "fire" }),
  );
  assert.equal(input.isBreathing, true);
  assert.ok(assumptionsApplied.includes("BREATHING_DEFAULT_TRUE_UNLESS_CRITICAL_DROWNING"));
});

test("BREATHING default: assumed false only for critical + drowning", () => {
  const { input } = adaptToTriageInput(makeSOS({ priority: "critical", incidentType: "drowning" }));
  assert.equal(input.isBreathing, false);
});

test("BREATHING default: high-priority drowning alone does not flip to false", () => {
  const { input } = adaptToTriageInput(makeSOS({ priority: "high", incidentType: "drowning" }));
  assert.equal(input.isBreathing, true);
});

test("description keyword 'not breathing' overrides the default toward false", () => {
  const { input, assumptionsApplied } = adaptToTriageInput(
    makeSOS({ priority: "medium", incidentType: "medical", description: "Victim is not breathing." }),
  );
  assert.equal(input.isBreathing, false);
  assert.ok(assumptionsApplied.includes("BREATHING_FALSE_FROM_DESCRIPTION_KEYWORD"));
});

test("direct victim vitals override both the priority default and the keyword scan", () => {
  const vitals: VictimVitals = { breathing: true };
  const { input, assumptionsApplied } = adaptToTriageInput(
    makeSOS({ priority: "critical", incidentType: "drowning", description: "not breathing" }),
    vitals,
  );
  assert.equal(input.isBreathing, true);
  assert.ok(!assumptionsApplied.includes("BREATHING_DEFAULT_TRUE_UNLESS_CRITICAL_DROWNING"));
  assert.ok(!assumptionsApplied.includes("BREATHING_FALSE_FROM_DESCRIPTION_KEYWORD"));
});

// --- canFollowCommands -----------------------------------------------------

test("COMMANDS_FROM_PRIORITY: critical infers canFollowCommands=false", () => {
  const { input, assumptionsApplied } = adaptToTriageInput(makeSOS({ priority: "critical" }));
  assert.equal(input.canFollowCommands, false);
  assert.ok(assumptionsApplied.includes("COMMANDS_FROM_PRIORITY"));
});

test("COMMANDS_FROM_PRIORITY: non-critical infers canFollowCommands=true", () => {
  const { input } = adaptToTriageInput(makeSOS({ priority: "medium" }));
  assert.equal(input.canFollowCommands, true);
});

test("description keyword 'unconscious' overrides toward canFollowCommands=false", () => {
  const { input, assumptionsApplied } = adaptToTriageInput(
    makeSOS({ priority: "low", description: "Bystander reports victim is unconscious." }),
  );
  assert.equal(input.canFollowCommands, false);
  assert.ok(assumptionsApplied.includes("COMMANDS_FALSE_FROM_DESCRIPTION_KEYWORD"));
});

test("direct mentalStatus vitals override priority and keyword inference", () => {
  const vitals: VictimVitals = { mentalStatus: "alert" };
  const { input, assumptionsApplied } = adaptToTriageInput(
    makeSOS({ priority: "critical", description: "unresponsive" }),
    vitals,
  );
  assert.equal(input.canFollowCommands, true);
  assert.ok(!assumptionsApplied.includes("COMMANDS_FROM_PRIORITY"));
  assert.ok(!assumptionsApplied.includes("COMMANDS_FALSE_FROM_DESCRIPTION_KEYWORD"));
});

// --- respiratoryRate / capillaryRefillSec: always inferred ------------------

test("RESP_RATE / CAP_REFILL: critical priority infers threshold-crossing values", () => {
  const { input, assumptionsApplied } = adaptToTriageInput(makeSOS({ priority: "critical" }));
  assert.equal(input.respiratoryRate, 32);
  assert.equal(input.capillaryRefillSec, 3);
  assert.ok(assumptionsApplied.includes("RESP_RATE_INFERRED_FROM_PRIORITY"));
  assert.ok(assumptionsApplied.includes("CAP_REFILL_INFERRED_FROM_PRIORITY"));
});

test("RESP_RATE / CAP_REFILL: non-critical priority infers normal values", () => {
  const { input } = adaptToTriageInput(makeSOS({ priority: "high" }));
  assert.equal(input.respiratoryRate, 20);
  assert.equal(input.capillaryRefillSec, 1);
});

test("RESP_RATE / CAP_REFILL are inferred even when victim vitals are supplied", () => {
  // Nothing in VictimVitalsSchema captures either field today.
  const { assumptionsApplied } = adaptToTriageInput(makeSOS({ priority: "critical" }), {
    breathing: true,
    ableToWalk: false,
    mentalStatus: "alert",
  });
  assert.ok(assumptionsApplied.includes("RESP_RATE_INFERRED_FROM_PRIORITY"));
  assert.ok(assumptionsApplied.includes("CAP_REFILL_INFERRED_FROM_PRIORITY"));
});

// --- end-to-end through triage() --------------------------------------------

test("end-to-end: a low-priority SOS adapts to GREEN", () => {
  const { input } = adaptToTriageInput(makeSOS({ priority: "low" }));
  assert.equal(triage(input).category, "minor");
});

test("end-to-end: a critical drowning SOS adapts to BLACK", () => {
  const { input } = adaptToTriageInput(makeSOS({ priority: "critical", incidentType: "drowning" }));
  assert.equal(triage(input).category, "deceased");
});

test("end-to-end: a critical (non-drowning) SOS adapts to RED", () => {
  const { input } = adaptToTriageInput(makeSOS({ priority: "critical", incidentType: "fire" }));
  assert.equal(triage(input).category, "immediate");
});

test("end-to-end: a medium-priority SOS adapts to YELLOW", () => {
  const { input } = adaptToTriageInput(makeSOS({ priority: "medium" }));
  assert.equal(triage(input).category, "delayed");
});
