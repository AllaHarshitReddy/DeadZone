import { z } from "zod";
import { GeoPointSchema } from "./common";

export const ResponderSpecialtySchema = z.enum([
  "medical",
  "fire",
  "search_rescue",
  "police",
  "volunteer",
]);
export type ResponderSpecialty = z.infer<typeof ResponderSpecialtySchema>;

export const ResponderStatusSchema = z.enum(["available", "enroute", "busy", "offline"]);
export type ResponderStatus = z.infer<typeof ResponderStatusSchema>;

export const ResponderSchema = z.object({
  id: z.uuid(),
  deviceId: z.uuid(),
  name: z.string(),
  specialty: ResponderSpecialtySchema.optional(),
  status: ResponderStatusSchema,
  geo: GeoPointSchema.optional(),
  capacity: z.number().int().positive().optional(),
});
export type Responder = z.infer<typeof ResponderSchema>;
