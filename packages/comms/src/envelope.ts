import { EnvelopeSchema, type Envelope } from "@sankat-setu/schema";

/**
 * Serializes an Envelope to JSON for transmission over the wire.
 * No signing or encryption -- see CLAUDE.md cut list.
 */
export function serializeEnvelope(envelope: Envelope): string {
  return JSON.stringify(envelope);
}

/**
 * Deserializes and validates a JSON string as an Envelope.
 * Throws a Zod validation error if the structure is invalid.
 */
export function deserializeEnvelope(json: string): Envelope {
  const parsed = JSON.parse(json);
  return EnvelopeSchema.parse(parsed);
}

/**
 * Safely parses a JSON string as an Envelope, returning null on parse or
 * validation failure instead of throwing. Useful for transport layers that
 * want to log errors but continue processing.
 */
export function tryDeserializeEnvelope(json: string): Envelope | null {
  try {
    return deserializeEnvelope(json);
  } catch {
    return null;
  }
}
