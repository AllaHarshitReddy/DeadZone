import { z } from "zod";
import type { PeerTable } from "./peers";

/**
 * Coverage meter states derived from peer-table observations, not
 * hardware specs. See CLAUDE.md: "Coverage is measured, never estimated."
 * The colors feed the UI later; build the data layer now.
 *
 * GREEN: responder reached within the last 30 seconds
 * AMBER: responder known but last seen between 30s and 2min ago
 * RED: responder either not in peer table, or last seen >2min ago
 */
export const CoverageStateSchema = z.enum(["GREEN", "AMBER", "RED"]);
export type CoverageState = z.infer<typeof CoverageStateSchema>;

export const CoverageMetersSchema = z.object({
  state: CoverageStateSchema,
  peersVisible: z.number().int().nonnegative(),
  responderLastSeen: z.iso.datetime().optional(),
  secondsSinceLastSeen: z.number().nonnegative().optional(),
  message: z.string(),
});
export type CoverageMeters = z.infer<typeof CoverageMetersSchema>;

const COVERAGE_TIMEOUT_MS = 30_000; // 30 seconds -> AMBER
const COVERAGE_RED_MS = 120_000; // 2 minutes -> RED

/**
 * Derives the current coverage state from the peer table. Looks for any
 * peer with isResponder=true and checks when they were last seen.
 * This is the only place coverage determination happens -- the UI just
 * displays the result.
 */
export function computeCoverage(peerTable: PeerTable): CoverageMeters {
  const now = new Date();
  const peers = peerTable.getAllPeers();
  const responder = peers.find((p) => p.isResponder);

  if (!responder) {
    return CoverageMetersSchema.parse({
      state: "RED",
      peersVisible: peers.length,
      message: "Responder not found in peer table.",
    });
  }

  const lastSeen = new Date(responder.lastSeen);
  const elapsedMs = now.getTime() - lastSeen.getTime();

  let state: CoverageState;
  if (elapsedMs <= COVERAGE_TIMEOUT_MS) {
    state = "GREEN";
  } else if (elapsedMs <= COVERAGE_RED_MS) {
    state = "AMBER";
  } else {
    state = "RED";
  }

  return CoverageMetersSchema.parse({
    state,
    peersVisible: peers.length,
    responderLastSeen: responder.lastSeen,
    secondsSinceLastSeen: Math.round(elapsedMs / 1000),
    message:
      state === "GREEN"
        ? "Connected to responder."
        : state === "AMBER"
          ? `Responder unreachable for ${Math.round(elapsedMs / 1000)}s.`
          : `Responder unreachable for ${Math.round(elapsedMs / 1000)}s. Check connection.`,
  });
}
