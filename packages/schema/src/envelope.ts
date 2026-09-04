import { z } from "zod";
import { GeoPointSchema, PrioritySchema } from "./common";

export const EnvelopeTypeSchema = z.enum(["sos", "triage_result", "responder_status", "ack"]);
export type EnvelopeType = z.infer<typeof EnvelopeTypeSchema>;

// The wire contract only. Transport, routing, dedup, signing and relay
// behaviour are out of scope tonight — see docs/decisions.md.
// `body` is intentionally z.unknown(): typing it per `type` would couple
// this contract to transport concerns that don't exist yet.
export const EnvelopeSchema = z.object({
  id: z.uuid(),
  orig: z.uuid(),
  ts: z.iso.datetime(),
  ttl: z.number().int().nonnegative(),
  prio: PrioritySchema,
  type: EnvelopeTypeSchema,
  geo: GeoPointSchema,
  body: z.unknown(),
});
export type Envelope = z.infer<typeof EnvelopeSchema>;
