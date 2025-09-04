import { supabase } from './supabaseClient'
import type { 
  TablesUpdate,
  SegmentCode, 
  ParticipantRole, 
  LobbyPresence, 
  SessionPhase, 
  GameState,
  Powerup,
  SegmentConfigInput,
  CreateDailyRoomResponse
} from './types'

// 1. Create Session (Host PC → GameSetup)
export async function createSession(hostPassword: string): Promise<{ sessionId: string; sessionCode: string }> {
  const { data, error } = await supabase
    .from('Session')
    .insert({
      host_password: hostPassword,
      phase: 'Setup',
      game_state: 'pre-quiz'
    })
    .select('session_id, session_code')
    .single()

  if (error) {
    throw new Error(`Failed to create session: ${error.message}`)
  }

  return { sessionId: data.session_id, sessionCode: data.session_code }
}

// Helper function to resolve session_code to session_id
export async function getSessionIdByCode(sessionCode: string): Promise<string> {
  const { data, error } = await supabase
    .from('Session')
    .select('session_id')
    .eq('session_code', sessionCode.toUpperCase())
    .single()

  if (error) {
    throw new Error(`Session not found: ${error.message}`)
  }

  return data.session_id
}

// 2. Add Segment Config (GameSetup)
export async function setSegmentConfig(
  sessionId: string, 
  configs: SegmentConfigInput[]
): Promise<void> {
  const configsWithSessionId = configs.map(config => ({
    session_id: sessionId,
    segment_code: config.segment_code,
    questions_count: config.questions_count
  }))

  const { error } = await supabase
    .from('SegmentConfig')
    .upsert(configsWithSessionId, {
      onConflict: 'session_id,segment_code'
    })

  if (error) {
    throw new Error(`Failed to set segment config: ${error.message}`)
  }
}

// 3. Create Daily Room (GameSetup → Netlify Function)
export async function createDailyRoom(sessionId: string): Promise<void> {
  try {
    // Call Netlify function
    const response = await fetch('/create-daily-room', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ session_id: sessionId })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: CreateDailyRoomResponse = await response.json()

    // Insert/update DailyRoom table
    const { error } = await supabase
      .from('DailyRoom')
      .upsert({
        room_id: sessionId,
        room_url: data.room_url,
        ready: true
      })

    if (error) {
      throw new Error(`Failed to save Daily room: ${error.message}`)
    }
  } catch (error) {
    throw new Error(`Failed to create Daily room: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// 4. Join as Host (Phone → Join)
export async function joinAsHost(
  sessionId: string, 
  password: string, 
  hostName: string
): Promise<string> {
  // Verify host password using RPC
  const { data: isValidPassword, error: rpcError } = await supabase
    .rpc('verify_host_password', {
      p_session: sessionId,
      p_password: password
    })

  if (rpcError) {
    throw new Error(`Failed to verify password: ${rpcError.message}`)
  }

  if (!isValidPassword) {
    throw new Error('Invalid host password')
  }

  // Insert participant as host
  const { data, error } = await supabase
    .from('Participant')
    .insert({
      session_id: sessionId,
      name: hostName,
      role: 'Host'
    })
    .select('participant_id')
    .single()

  if (error) {
    throw new Error(`Failed to join as host: ${error.message}`)
  }

  return data.participant_id
}

// 5. Join as Player (Phone → Join)
export async function joinAsPlayer(
  sessionId: string, 
  name: string, 
  flag: string, 
  logoUrl: string
): Promise<string> {
  // Check existing players to determine role
  const { data: existingPlayers, error: countError } = await supabase
    .from('Participant')
    .select('role')
    .eq('session_id', sessionId)
    .in('role', ['Player1', 'Player2'])

  if (countError) {
    throw new Error(`Failed to check existing players: ${countError.message}`)
  }

  // Determine role based on existing players
  let role: ParticipantRole
  const hasPlayer1 = existingPlayers.some(p => p.role === 'Player1')
  const hasPlayer2 = existingPlayers.some(p => p.role === 'Player2')

  if (!hasPlayer1) {
    role = 'Player1'
  } else if (!hasPlayer2) {
    role = 'Player2'
  } else {
    throw new Error('Session is full - maximum 2 players allowed')
  }

  // Insert participant as player
  const { data, error } = await supabase
    .from('Participant')
    .insert({
      session_id: sessionId,
      name: name,
      role: role,
      flag: flag,
      team_logo_url: logoUrl
    })
    .select('participant_id')
    .single()

  if (error) {
    throw new Error(`Failed to join as player: ${error.message}`)
  }

  return data.participant_id
}

// 6. Update Presence (Lobby & Call)
export async function updateLobbyPresence(
  participantId: string, 
  status: LobbyPresence
): Promise<void> {
  const { error } = await supabase
    .from('Participant')
    .update({ lobby_presence: status })
    .eq('participant_id', participantId)

  if (error) {
    throw new Error(`Failed to update lobby presence: ${error.message}`)
  }
}

export async function updateVideoPresence(
  participantId: string, 
  connected: boolean
): Promise<void> {
  const { error } = await supabase
    .from('Participant')
    .update({ video_presence: connected })
    .eq('participant_id', participantId)

  if (error) {
    throw new Error(`Failed to update video presence: ${error.message}`)
  }
}

// 7. Update Phase / Game State (Host actions)
export async function updatePhase(
  sessionId: string, 
  phase: SessionPhase, 
  gameState?: GameState
): Promise<void> {
  const updateData: TablesUpdate<'Session'> = { phase }
  
  if (gameState) {
    updateData.game_state = gameState
  }

  const { error } = await supabase
    .from('Session')
    .update(updateData)
    .eq('session_id', sessionId)

  if (error) {
    throw new Error(`Failed to update phase: ${error.message}`)
  }
}

// 8. Update Score (Quiz)
export async function updateScore(
  sessionId: string, 
  participantId: string, 
  segmentCode: SegmentCode, 
  points: number
): Promise<void> {
  // First try to get existing score
  const { data: existingScore, error: selectError } = await supabase
    .from('Score')
    .select('points')
    .eq('session_id', sessionId)
    .eq('participant_id', participantId)
    .eq('segment_code', segmentCode)
    .single()

  let totalPoints = points

  // If score exists, add to existing points
  if (existingScore && !selectError) {
    totalPoints = existingScore.points + points
  }

  // Upsert the score
  const { error } = await supabase
    .from('Score')
    .upsert({
      session_id: sessionId,
      participant_id: participantId,
      segment_code: segmentCode,
      points: totalPoints
    }, {
      onConflict: 'session_id,participant_id,segment_code'
    })

  if (error) {
    throw new Error(`Failed to update score: ${error.message}`)
  }
}

// 9. Use Powerup (Quiz)
export async function activatePowerup(
  participantId: string, 
  powerup: Powerup
): Promise<void> {
  const powerupColumnMap = {
    'pass': 'powerup_pass_used',
    'alhabeed': 'powerup_alhabeed',
    'bellegoal': 'powerup_bellegoal',
    'slippyg': 'powerup_slippyg'
  } as const

  const column = powerupColumnMap[powerup]
  
  const { error } = await supabase
    .from('Participant')
    .update({ [column]: true })
    .eq('participant_id', participantId)

  if (error) {
    throw new Error(`Failed to use powerup: ${error.message}`)
  }
}

// 10. End Session
export async function endSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('Session')
    .update({ 
      game_state: 'concluded',
      ended_at: new Date().toISOString()
    })
    .eq('session_id', sessionId)

  if (error) {
    throw new Error(`Failed to end session: ${error.message}`)
  }
}

// 11. Increment Strike (WDYK only)
export async function incrementStrike(
  sessionId: string, 
  participantId: string
): Promise<number> {
  // First get current strikes count
  const { data: existingStrike, error: selectError } = await supabase
    .from('Strikes')
    .select('strikes')
    .eq('session_id', sessionId)
    .eq('participant_id', participantId)
    .eq('segment_code', 'WDYK')
    .single()

  let newStrikesCount = 1

  // If strike record exists, increment by 1
  if (existingStrike && !selectError) {
    newStrikesCount = existingStrike.strikes + 1
  }

  // Upsert the strike record
  const { error } = await supabase
    .from('Strikes')
    .upsert({
      session_id: sessionId,
      participant_id: participantId,
      segment_code: 'WDYK',
      strikes: newStrikesCount
    }, {
      onConflict: 'session_id,participant_id,segment_code'
    })

  if (error) {
    throw new Error(`Failed to increment strike: ${error.message}`)
  }

  return newStrikesCount
}

// 12. Reset Strikes (WDYK only)
export async function resetStrikes(
  sessionId: string, 
  participantId: string
): Promise<void> {
  const { error } = await supabase
    .from('Strikes')
    .upsert({
      session_id: sessionId,
      participant_id: participantId,
      segment_code: 'WDYK',
      strikes: 0
    }, {
      onConflict: 'session_id,participant_id,segment_code'
    })

  if (error) {
    throw new Error(`Failed to reset strikes: ${error.message}`)
  }
}

// 13. Get Segment Config for Session
export async function getSegmentConfig(sessionId: string): Promise<SegmentConfigInput[]> {
  const { data, error } = await supabase
    .from('SegmentConfig')
    .select('segment_code, questions_count')
    .eq('session_id', sessionId)

  if (error) {
    throw new Error(`Failed to get segment config: ${error.message}`)
  }

  return data || []
}
