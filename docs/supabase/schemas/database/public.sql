-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.DailyRoom (
  room_id uuid NOT NULL,
  room_url text NOT NULL,
  active_participants jsonb DEFAULT '[]'::jsonb,
  host_permissions jsonb DEFAULT '{}'::jsonb,
  ready boolean DEFAULT false,
  CONSTRAINT DailyRoom_pkey PRIMARY KEY (room_id),
  CONSTRAINT DailyRoom_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.Session(session_id)
);
CREATE TABLE public.Participant (
  participant_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  session_id uuid NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['Host'::text, 'Player1'::text, 'Player2'::text])),
  video_presence boolean DEFAULT false,
  lobby_presence text NOT NULL DEFAULT 'NotJoined'::text CHECK (lobby_presence = ANY (ARRAY['NotJoined'::text, 'Joined'::text, 'Disconnected'::text])),
  flag text,
  team_logo_url text,
  powerup_pass_used boolean DEFAULT false,
  powerup_alhabeed boolean DEFAULT false,
  powerup_bellegoal boolean DEFAULT false,
  powerup_slippyg boolean DEFAULT false,
  join_at timestamp with time zone,
  disconnect_at timestamp with time zone,
  CONSTRAINT Participant_pkey PRIMARY KEY (participant_id),
  CONSTRAINT Participant_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.Session(session_id)
);
CREATE TABLE public.Score (
  score_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  session_id uuid NOT NULL,
  participant_id uuid NOT NULL,
  segment_code text NOT NULL CHECK (segment_code = ANY (ARRAY['WDYK'::text, 'AUCT'::text, 'BELL'::text, 'UPDW'::text, 'REMO'::text])),
  points integer NOT NULL DEFAULT 0,
  CONSTRAINT Score_pkey PRIMARY KEY (score_id),
  CONSTRAINT Score_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.Participant(participant_id),
  CONSTRAINT Score_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.Session(session_id)
);
CREATE TABLE public.SegmentConfig (
  config_id uuid NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
  session_id uuid NOT NULL,
  segment_code text NOT NULL CHECK (segment_code = ANY (ARRAY['WDYK'::text, 'AUCT'::text, 'BELL'::text, 'UPDW'::text, 'REMO'::text])),
  questions_count integer NOT NULL,
  CONSTRAINT SegmentConfig_pkey PRIMARY KEY (config_id),
  CONSTRAINT SegmentConfig_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.Session(session_id)
);
CREATE TABLE public.Session (
  session_id uuid NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
  host_password text NOT NULL,
  phase text NOT NULL CHECK (phase = ANY (ARRAY['Setup'::text, 'Lobby'::text, 'Full Lobby'::text, 'In-Progress'::text, 'Tie-Breaker'::text, 'Results'::text, 'Review'::text])),
  game_state text NOT NULL CHECK (game_state = ANY (ARRAY['pre-quiz'::text, 'active'::text, 'post-quiz'::text, 'concluded'::text])),
  created_at timestamp with time zone DEFAULT now(),
  ended_at timestamp with time zone,
  session_code text NOT NULL UNIQUE,
  CONSTRAINT Session_pkey PRIMARY KEY (session_id)
);
CREATE TABLE public.Strikes (
  strike_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  session_id uuid NOT NULL,
  participant_id uuid NOT NULL,
  segment_code text NOT NULL CHECK (segment_code = 'WDYK'::text),
  strikes integer NOT NULL DEFAULT 0,
  CONSTRAINT Strikes_pkey PRIMARY KEY (strike_id),
  CONSTRAINT Strikes_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.Participant(participant_id),
  CONSTRAINT Strikes_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.Session(session_id)
);