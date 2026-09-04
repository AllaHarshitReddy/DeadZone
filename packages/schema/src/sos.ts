import { z } from "zod";
import { GeoPointSchema, PrioritySchema } from "./common";

export const IncidentTypeSchema = z.enum([
  "medical",
  "fire",
  "flood",
  "building_collapse",
  "trapped",
  "road_accident",
  "gas_leak",
  "drowning",
  "other",
]);
export type IncidentType = z.infer<typeof IncidentTypeSchema>;

export const SOSStatusSchema = z.enum([
  "new",
  "acknowledged",
  "dispatched",
  "in_progress",
  "resolved",
  "closed",
]);
export type SOSStatus = z.infer<typeof SOSStatusSchema>;

export const SOSRequestSchema = z.object({
  id: z.uuid(),
  deviceId: z.uuid(),
  reporterName: z.string().optional(),
  reporterPhone: z.string().optional(),
  incidentType: IncidentTypeSchema,
  priority: PrioritySchema,
  victimCount: z.number().int().positive(),
  description: z.string(),
  geo: GeoPointSchema,
  status: SOSStatusSchema,
  assignedResponderId: z.uuid().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime().optional(),
});
export type SOSRequest = z.infer<typeof SOSRequestSchema>;
