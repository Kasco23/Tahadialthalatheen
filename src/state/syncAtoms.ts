import type { AtomGameSync } from '@/lib/atomGameSync';
import type { PlayerId } from '@/types/game';
import { atom } from 'jotai';

// Connection and sync atoms
export const isConnectedToSupabaseAtom = atom<boolean>(false);
export const connectionErrorAtom = atom<string | null>(null);
export const gameSyncInstanceAtom = atom<AtomGameSync | null>(null);

// Presence tracking atoms
export interface LobbyParticipant {
  id: string;
  name: string;
  type: 'controller' | 'host' | 'player';
  playerId?: PlayerId;
  flag?: string;
  club?: string;
  isConnected: boolean;
}

export const lobbyParticipantsAtom = atom<LobbyParticipant[]>([]);
export const myParticipantAtom = atom<LobbyParticipant | null>(null);

// Real-time event atoms
export const lastBroadcastAtom = atom<{
  event: string;
  payload: unknown;
  timestamp: number;
} | null>(null);

// Derived atoms
export const connectedParticipantsAtom = atom<LobbyParticipant[]>((get) =>
  get(lobbyParticipantsAtom).filter((p) => p.isConnected),
);

export const playerParticipantsAtom = atom<LobbyParticipant[]>((get) =>
  get(lobbyParticipantsAtom).filter((p) => p.type === 'player'),
);

export const hostParticipantsAtom = atom<LobbyParticipant[]>((get) =>
  get(lobbyParticipantsAtom).filter((p) => p.type.startsWith('host')),
);

// Actions for presence management
export const addParticipantAtom = atom(
  null,
  (get, set, participant: LobbyParticipant) => {
    const current = get(lobbyParticipantsAtom);
    const existing = current.find((p) => p.id === participant.id);

    if (existing) {
      // Update existing participant
      set(
        lobbyParticipantsAtom,
        current.map((p) =>
          p.id === participant.id ? { ...p, ...participant } : p,
        ),
      );
    } else {
      // Add new participant
      set(lobbyParticipantsAtom, [...current, participant]);
    }
  },
);

export const removeParticipantAtom = atom(
  null,
  (get, set, participantId: string) => {
    const current = get(lobbyParticipantsAtom);
    set(
      lobbyParticipantsAtom,
      current.filter((p) => p.id !== participantId),
    );
  },
);

export const updateParticipantAtom = atom(
  null,
  (
    get,
    set,
    { id, update }: { id: string; update: Partial<LobbyParticipant> },
  ) => {
    const current = get(lobbyParticipantsAtom);
    set(
      lobbyParticipantsAtom,
      current.map((p) => (p.id === id ? { ...p, ...update } : p)),
    );
  },
);

export const setMyParticipantAtom = atom(
  null,
  (_get, set, participant: LobbyParticipant | null) => {
    set(myParticipantAtom, participant);
    if (participant) {
      // Also add/update in the participants list
      set(addParticipantAtom, participant);
    }
  },
);

// Broadcast events
export const broadcastEventAtom = atom(
  null,
  (_get, set, { event, payload }: { event: string; payload: unknown }) => {
    set(lastBroadcastAtom, {
      event,
      payload,
      timestamp: Date.now(),
    });
  },
);
