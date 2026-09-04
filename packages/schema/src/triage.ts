import { z } from "zod";

export const TriageCategorySchema = z.enum(["immediate", "delayed", "minor", "deceased"]);
export type TriageCategory = z.infer<typeof TriageCategorySchema>;

// method is a literal, not an enum: triage is deterministic START-protocol
// rules only, never LLM output. See docs/decisions.md.
export const TriageResultSchema = z.object({
  id: z.uuid(),
  sosRequestId: z.uuid(),
  victimId: z.uuid().optional(),
  category: TriageCategorySchema,
  reasonCodes: z.array(z.string()).min(1),
  method: z.literal("start_protocol"),
  computedAt: z.iso.datetime(),
});
export type TriageResult = z.infer<typeof TriageResultSchema>;
