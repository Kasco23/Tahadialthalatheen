import { Logger } from "./logger";

/**
 * Password Hashing Utility
 *
 * Provides simple password hashing for participant authentication
 * Uses Web Crypto API's SHA-256 for client-side hashing
 *
 * Note: For production, consider using bcrypt or argon2 via serverless function
 * This is a lightweight solution suitable for the current use case
 */

/**
 * Hash a password using SHA-256
 * @param password - Plain text password
 * @returns Promise<string> - Hex-encoded hash
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    // Convert password to Uint8Array
    const encoder = new TextEncoder();
    const data = encoder.encode(password);

    // Hash using SHA-256
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);

    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

    return hashHex;
  } catch (error) {
    Logger.error("Error hashing password:", error);
    throw new Error("Failed to hash password");
  }
}

/**
 * Verify a password against a hash
 * @param password - Plain text password to verify
 * @param hash - Previously generated hash
 * @returns Promise<boolean> - True if password matches hash
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  try {
    const passwordHash = await hashPassword(password);
    return passwordHash === hash;
  } catch (error) {
    Logger.error("Error verifying password:", error);
    return false;
  }
}
