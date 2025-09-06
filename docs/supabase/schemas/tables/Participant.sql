create table public."Participant" (
  participant_id uuid not null default extensions.uuid_generate_v4 (),
  session_id uuid not null,
  name text not null,
  role text not null,
  video_presence boolean null default false,
  lobby_presence text not null default 'NotJoined'::text,
  flag text null,
  team_logo_url text null,
  powerup_pass_used boolean null default false,
  powerup_alhabeed boolean null default false,
  powerup_bellegoal boolean null default false,
  powerup_slippyg boolean null default false,
  constraint Participant_pkey primary key (participant_id),
  constraint Participant_session_id_fkey foreign KEY (session_id) references "Session" (session_id) on delete CASCADE,
  constraint Participant_lobby_presence_check check (
    (
      lobby_presence = any (
        array[
          'NotJoined'::text,
          'Joined'::text,
          'Disconnected'::text
        ]
      )
    )
  ),
  constraint Participant_role_check check (
    (
      role = any (
        array['Host'::text, 'Player1'::text, 'Player2'::text]
      )
    )
  )
) TABLESPACE pg_default;