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

/**
 * Blood group as a closed set, so a responder never has to interpret free text
 * in an emergency. ASCII hyphen deliberately -- the civilian UI renders the
 * typographic minus (U+2212) for legibility, but the wire value stays ASCII so
 * a stored document can be compared, grepped and round-tripped without a
 * lookalike-character trap.
 *
 * "unknown" is a real answer, not a missing one: a civilian who taps "Not
 * known" has told us something, and that is different from a civilian who
 * never filled the profile in (field absent). Keep both states.
 */
export const BloodGroupSchema = z.enum([
  "A+",
  "A-",
  "B+",
  "B-",
  "O+",
  "O-",
  "AB+",
  "AB-",
  "unknown",
]);
export type BloodGroup = z.infer<typeof BloodGroupSchema>;

/** Next of kin a responder can call. Capped at 3 by SOSRequestSchema below. */
export const EmergencyContactSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
});
export type EmergencyContact = z.infer<typeof EmergencyContactSchema>;

export const SOSRequestSchema = z.object({
  id: z.uuid(),
  deviceId: z.uuid(),
  reporterName: z.string().optional(),
  reporterPhone: z.string().optional(),
  /**
   * Medical profile carried from the civilian's ProfileSetup. All optional:
   * every SOS written before this field existed must still validate, and a
   * civilian who skips the profile still sends a complete, valid SOS.
   */
  bloodGroup: BloodGroupSchema.optional(),
  emergencyContacts: z.array(EmergencyContactSchema).max(3).optional(),
  medicalNotes: z.string().max(280).optional(),
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
