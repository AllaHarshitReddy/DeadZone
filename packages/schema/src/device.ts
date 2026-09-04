import { z } from "zod";
import { GeoPointSchema } from "./common";

export const DeviceRoleSchema = z.enum(["civilian", "responder", "edge_node"]);
export type DeviceRole = z.infer<typeof DeviceRoleSchema>;

export const DevicePlatformSchema = z.enum(["android", "ios", "laptop"]);
export type DevicePlatform = z.infer<typeof DevicePlatformSchema>;

export const DeviceSchema = z.object({
  id: z.uuid(),
  role: DeviceRoleSchema,
  platform: DevicePlatformSchema,
  label: z.string().optional(),
  lastSeenAt: z.iso.datetime().optional(),
  geo: GeoPointSchema.optional(),
});
export type Device = z.infer<typeof DeviceSchema>;
