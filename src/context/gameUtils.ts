import type { GameRecord } from '@/lib/gameDatabase';
import type { GameState, SegmentCode } from '@/types/game';
import { defaultPlayers } from './defaults';
import { initialGameState } from './initialGameState';

/** Map a Supabase record to our internal GameState shape */
export function mapRecordToState(record: GameRecord): GameState {
  return {
    ...initialGameState,
    sessionId: record.session_id,
    hostCode: record.host_code,
    hostName: record.host_name ?? null,
    phase: record.phase as GameState['phase'],
    currentSegment: record.current_segment as GameState['currentSegment'],
    currentQuestionIndex: record.current_question_index,
    videoRoomUrl: record.video_room_url ?? undefined,
    videoRoomCreated: record.video_room_created,
    timer: record.timer,
    isTimerRunning: record.is_timer_running,
    segmentSettings: record.segment_settings as Record<SegmentCode, number>,
    players: defaultPlayers,
  };
}
