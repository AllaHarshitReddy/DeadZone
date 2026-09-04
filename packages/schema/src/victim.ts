import { z } from "zod";
import { GeoPointSchema } from "./common";

export const GenderSchema = z.enum(["male", "female", "other", "unknown"]);
export type Gender = z.infer<typeof GenderSchema>;

export const MentalStatusSchema = z.enum(["alert", "verbal", "pain", "unresponsive"]);
export type MentalStatus = z.infer<typeof MentalStatusSchema>;

export const VictimVitalsSchema = z.object({
  breathing: z.boolean().optional(),
  ableToWalk: z.boolean().optional(),
  radialPulseDetected: z.boolean().optional(),
  mentalStatus: MentalStatusSchema.optional(),
});
export type VictimVitals = z.infer<typeof VictimVitalsSchema>;

export const VictimSchema = z.object({
  id: z.uuid(),
  sosRequestId: z.uuid().optional(),
  name: z.string().optional(),
  age: z.number().int().nonnegative().optional(),
  gender: GenderSchema.optional(),
  geo: GeoPointSchema.optional(),
  vitals: VictimVitalsSchema.optional(),
  notes: z.string().optional(),
});
export type Victim = z.infer<typeof VictimSchema>;
