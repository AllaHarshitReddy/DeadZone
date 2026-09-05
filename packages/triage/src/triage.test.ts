import { test } from "node:test";
import assert from "node:assert/strict";
import { triage, TRIAGE_TAG_COLOR, type TriageInput } from "./triage";

const BASE: TriageInput = {
  canWalk: false,
  isBreathing: true,
  respiratoryRate: 16,
  capillaryRefillSec: 1,
  canFollowCommands: true,
};

test("branch 1: canWalk -> minor (GREEN)", () => {
  const result = triage({ ...BASE, canWalk: true });
  assert.equal(result.category, "minor");
  assert.equal(result.reasonCode, "CAN_WALK");
  assert.equal(TRIAGE_TAG_COLOR[result.category], "GREEN");
});

test("branch 1 takes precedence over every other field", () => {
  // canWalk=true even alongside inputs that would otherwise be fatal.
  const result = triage({
    canWalk: true,
    isBreathing: false,
    respiratoryRate: 40,
    capillaryRefillSec: 5,
    canFollowCommands: false,
  });
  assert.equal(result.category, "minor");
  assert.equal(result.reasonCode, "CAN_WALK");
});

test("branch 2: not breathing after reposition -> deceased (BLACK)", () => {
  const result = triage({ ...BASE, isBreathing: false });
  assert.equal(result.category, "deceased");
  assert.equal(result.reasonCode, "APNEA_AFTER_REPOSITION");
  assert.equal(TRIAGE_TAG_COLOR[result.category], "BLACK");
});

test("branch 3: respiratoryRate > 30 -> immediate (RED)", () => {
  const result = triage({ ...BASE, respiratoryRate: 31 });
  assert.equal(result.category, "immediate");
  assert.equal(result.reasonCode, "RESP_GT_30");
  assert.equal(TRIAGE_TAG_COLOR[result.category], "RED");
});

test("respiratoryRate exactly 30 does not trigger branch 3", () => {
  const result = triage({ ...BASE, respiratoryRate: 30 });
  assert.notEqual(result.reasonCode, "RESP_GT_30");
});

test("branch 4: capillaryRefillSec > 2 -> immediate (RED)", () => {
  const result = triage({ ...BASE, capillaryRefillSec: 2.1 });
  assert.equal(result.category, "immediate");
  assert.equal(result.reasonCode, "CAP_REFILL_GT_2S");
});

test("capillaryRefillSec exactly 2 does not trigger branch 4", () => {
  const result = triage({ ...BASE, capillaryRefillSec: 2 });
  assert.notEqual(result.reasonCode, "CAP_REFILL_GT_2S");
});

test("branch 5: cannot follow commands -> immediate (RED)", () => {
  const result = triage({ ...BASE, canFollowCommands: false });
  assert.equal(result.category, "immediate");
  assert.equal(result.reasonCode, "CANNOT_FOLLOW_COMMANDS");
});

test("branch 6: otherwise -> delayed (YELLOW)", () => {
  const result = triage(BASE);
  assert.equal(result.category, "delayed");
  assert.equal(result.reasonCode, "STABLE_PENDING_TREATMENT");
  assert.equal(TRIAGE_TAG_COLOR[result.category], "YELLOW");
});

test("evaluation order: breathing check precedes respiratory rate check", () => {
  const result = triage({ ...BASE, isBreathing: false, respiratoryRate: 40 });
  assert.equal(result.reasonCode, "APNEA_AFTER_REPOSITION");
});

test("evaluation order: respiratory rate precedes capillary refill", () => {
  const result = triage({ ...BASE, respiratoryRate: 40, capillaryRefillSec: 5 });
  assert.equal(result.reasonCode, "RESP_GT_30");
});

test("evaluation order: capillary refill precedes cannot-follow-commands", () => {
  const result = triage({ ...BASE, capillaryRefillSec: 5, canFollowCommands: false });
  assert.equal(result.reasonCode, "CAP_REFILL_GT_2S");
});

test("rejects malformed input at runtime", () => {
  assert.throws(() => triage({ ...BASE, respiratoryRate: -1 } as TriageInput));
});
