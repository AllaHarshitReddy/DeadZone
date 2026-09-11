/**
 * The civilian's medical profile, held on this device.
 *
 * Collected once by ProfileSetup and replayed into every SOS this phone sends,
 * so a responder gets a blood group and a next-of-kin number without the
 * civilian typing anything during the emergency itself -- the SOS beat stays at
 * four gestures.
 *
 * localStorage, like the device id and the outbound queue: it survives a
 * reload, needs no network, and a phone that never reaches the command node
 * still keeps what the person entered. Nothing here may throw on the SOS path,
 * so every read is validated and every failure degrades to "no profile".
 */

import { z } from "zod";
import { BloodGroupSchema, EmergencyContactSchema } from "@deadzone/schema";
import type { BloodGroup, EmergencyContact } from "@deadzone/schema";

const PROFILE_KEY = "deadzone_medical_profile";

/**
 * Mirrors the medical fields on SOSRequestSchema rather than inventing a second
 * shape, so what is stored is exactly what travels. Everything is optional for
 * the same reason it is optional there: "Skip for now" must produce a valid
 * profile, and a profile written before a field existed must still load.
 */
export const MedicalProfileSchema = z.object({
  bloodGroup: BloodGroupSchema.optional(),
  emergencyContacts: z.array(EmergencyContactSchema).max(3).optional(),
  medicalNotes: z.string().max(280).optional(),
});
export type MedicalProfile = z.infer<typeof MedicalProfileSchema>;

export type { BloodGroup, EmergencyContact };

/**
 * The stored profile, or null when there is none.
 *
 * A blob that fails validation is treated as absent rather than repaired: the
 * only consumer is an emergency message, and half-parsed medical data is worse
 * than none. The civilian is then re-offered ProfileSetup on next login.
 */
export function loadProfile(): MedicalProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;

    const parsed = MedicalProfileSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      console.warn("[profile] stored profile did not validate, ignoring it:", parsed.error.issues);
      return null;
    }
    return parsed.data;
  } catch (err) {
    console.warn("[profile] unreadable, treating as unset:", err);
    return null;
  }
}

/**
 * Persist the profile, dropping empty values so the SOS body never carries a
 * blank string where a responder would read it as "they gave no answer".
 * Returns false if the write failed -- the caller keeps going either way,
 * because losing a profile must never block an SOS.
 */
export function saveProfile(profile: MedicalProfile): boolean {
  const contacts = (profile.emergencyContacts ?? []).filter(
    (c) => c.name.trim().length > 0 && c.phone.trim().length > 0,
  );
  const notes = profile.medicalNotes?.trim();

  const cleaned: MedicalProfile = {
    ...(profile.bloodGroup ? { bloodGroup: profile.bloodGroup } : {}),
    ...(contacts.length ? { emergencyContacts: contacts } : {}),
    ...(notes ? { medicalNotes: notes } : {}),
  };

  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(cleaned));
    return true;
  } catch (err) {
    console.error("[profile] failed to persist:", err);
    return false;
  }
}

/** True when this device has a stored profile, used to decide whether to ask. */
export function hasProfile(): boolean {
  return loadProfile() !== null;
}

export function clearProfile(): void {
  try {
    localStorage.removeItem(PROFILE_KEY);
  } catch (err) {
    console.warn("[profile] failed to clear:", err);
  }
}
