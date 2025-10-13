import { supabase } from "./supabaseClient";
import { Logger } from "./logger";

/**
 * Participant Authentication Module
 * 
 * Handles password hashing and verification for participants using Supabase's pgcrypto extension.
 * This uses the same secure encryption as host passwords (bcrypt via crypt()).
 */

/**
 * Hash a participant password using Supabase's pgcrypto extension
 * This uses bcrypt (blowfish) algorithm, same as host passwords
 */
export async function hashParticipantPassword(
  password: string
): Promise<string> {
  const { data, error } = await supabase.rpc("hash_participant_password", {
    password_input: password,
  });

  if (error) {
    Logger.error("Failed to hash participant password:", error);
    throw new Error(`Failed to hash password: ${error.message}`);
  }

  if (!data) {
    throw new Error("Failed to hash password: No data returned");
  }

  return data as string;
}

/**
 * Verify a participant's password
 * Returns true if the password matches, false otherwise
 */
export async function verifyParticipantPassword(
  participantId: string,
  password: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc("verify_participant_password", {
    participant_id_input: participantId,
    password_input: password,
  });

  if (error) {
    Logger.error("Failed to verify participant password:", error);
    return false;
  }

  return data === true;
}

/**
 * Set a participant's password (hashes it first)
 * This should be called when a participant first joins
 */
export async function setParticipantPassword(
  participantId: string,
  password: string
): Promise<void> {
  // Hash the password using the database function
  const hashedPassword = await hashParticipantPassword(password);

  // Store the hashed password
  const { error } = await supabase
    .from("Participant")
    .update({ password: hashedPassword })
    .eq("participant_id", participantId);

  if (error) {
    Logger.error("Failed to set participant password:", error);
    throw new Error(`Failed to set password: ${error.message}`);
  }

  Logger.log(`Password set for participant: ${participantId}`);
}
