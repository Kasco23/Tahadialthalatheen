import { Logger } from "./logger";
import type { UserSessionData } from "./userSession";

/**
 * Netlify Blobs Session Store
 * 
 * This module provides cross-device session persistence using Netlify Blobs
 * as a key-value store. It's designed to complement localStorage with
 * server-side storage that persists across devices and browsers.
 * 
 * Architecture:
 * - Primary storage: Netlify Blobs (server-side, cross-device)
 * - Fallback: localStorage (client-side, browser-specific)
 * - Use case: Store session data, participant info, Daily room tokens, etc.
 * 
 * Environment Variables Required:
 * - NETLIFY_SITE_ID: Your Netlify site ID
 * - NETLIFY_PERSONAL_ACCESS_TOKEN: Personal access token for Netlify API
 * 
 * Note: Direct blob access from client is not supported. Use Edge Functions
 * (get-session.ts, set-session.ts) as a proxy layer for security.
 */

export interface BlobSessionData extends UserSessionData {
  // Additional fields for cross-device persistence
  dailyRoomToken?: string;
  dailyRoomUrl?: string;
  isReady?: boolean;
  lastUpdated?: number; // timestamp
}

/**
 * Save session data to Netlify Blobs via Edge Function
 * @param sessionId - The session ID
 * @param participantId - The participant ID
 * @param data - Session data to save
 * @returns Promise<boolean> - Success status
 */
export async function saveSession(
  sessionId: string,
  participantId: string,
  data: BlobSessionData
): Promise<boolean> {
  try {
    const key = `${sessionId}:${participantId}`;
    
    // Call edge function to save data
    const response = await fetch(`/.netlify/edge-functions/set-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key,
        data: {
          ...data,
          lastUpdated: Date.now(),
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      Logger.error("Failed to save session to blob store:", error);
      return false;
    }

    const result = await response.json();
    Logger.log("Session saved to blob store:", { key, success: result.success });
    return result.success;
  } catch (error) {
    Logger.error("Error saving session to blob store:", error);
    return false;
  }
}

/**
 * Load session data from Netlify Blobs via Edge Function
 * @param sessionId - The session ID
 * @param participantId - The participant ID
 * @returns Promise<BlobSessionData | null> - Session data or null if not found
 */
export async function loadSession(
  sessionId: string,
  participantId: string
): Promise<BlobSessionData | null> {
  try {
    const key = `${sessionId}:${participantId}`;
    
    // Call edge function to load data
    const response = await fetch(
      `/.netlify/edge-functions/get-session?key=${encodeURIComponent(key)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        Logger.log("Session not found in blob store:", key);
        return null;
      }
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      Logger.error("Failed to load session from blob store:", error);
      return null;
    }

    const result = await response.json();
    if (!result.success || !result.data) {
      Logger.warn("No session data found in blob store:", key);
      return null;
    }

    Logger.log("Session loaded from blob store:", { key });
    return result.data;
  } catch (error) {
    Logger.error("Error loading session from blob store:", error);
    return null;
  }
}

/**
 * Delete session data from Netlify Blobs via Edge Function
 * @param sessionId - The session ID
 * @param participantId - The participant ID
 * @returns Promise<boolean> - Success status
 */
export async function deleteSession(
  sessionId: string,
  participantId: string
): Promise<boolean> {
  try {
    const key = `${sessionId}:${participantId}`;
    
    // Call edge function to delete data
    const response = await fetch(`/.netlify/edge-functions/set-session`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ key }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      Logger.error("Failed to delete session from blob store:", error);
      return false;
    }

    const result = await response.json();
    Logger.log("Session deleted from blob store:", { key, success: result.success });
    return result.success;
  } catch (error) {
    Logger.error("Error deleting session from blob store:", error);
    return false;
  }
}
