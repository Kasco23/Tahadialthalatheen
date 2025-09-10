import { atom } from "jotai";
import type { Tables } from "../lib/types/supabase";

// Session atoms
export const sessionAtom = atom<string | null>(null);
export const sessionCodeAtom = atom<string | null>(null);

// Participants atom - keyed by participant_id
export const participantsAtom = atom<Record<string, Tables<"Participant">>>({});

// Daily.co atoms
export const dailyRoomUrlAtom = atom<string | null>(null);
export const dailyTokenAtom = atom<string | null>(null);
export const dailyUserNameAtom = atom<string | null>(null);

// Enhanced Daily.co token management atoms
export const dailyTokenExpiryAtom = atom<number | null>(null); // timestamp when token expires
export const dailyTokenRefreshingAtom = atom<boolean>(false); // whether token is being refreshed

// Derived atoms
export const hostParticipantAtom = atom((get) => {
  const participants = get(participantsAtom);
  return Object.values(participants).find((p) => p.role === "Host") || null;
});

export const playerParticipantsAtom = atom((get) => {
  const participants = get(participantsAtom);
  return Object.values(participants).filter((p) => p.role.startsWith("Player"));
});

export const participantCountAtom = atom((get) => {
  const participants = get(participantsAtom);
  return Object.keys(participants).length;
});
