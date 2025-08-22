import type { Player } from '@/types/game';

export const defaultPlayers: Record<string, Player> = {
  playerA: {
    id: 'playerA',
    name: '',
    flag: '',
    club: '',
    role: 'playerA',
    score: 0,
    strikes: 0,
    isConnected: false,
    specialButtons: {
      LOCK_BUTTON: false,
      TRAVELER_BUTTON: false,
      PIT_BUTTON: false,
    },
  },
  playerB: {
    id: 'playerB',
    name: '',
    flag: '',
    club: '',
    role: 'playerB',
    score: 0,
    strikes: 0,
    isConnected: false,
    specialButtons: {
      LOCK_BUTTON: false,
      TRAVELER_BUTTON: false,
      PIT_BUTTON: false,
    },
  },
};
