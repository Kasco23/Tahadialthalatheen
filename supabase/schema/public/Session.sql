create table public."Session" (
  session_id uuid not null default extensions.uuid_generate_v4 (),
  host_password text not null,
  phase text not null,
  game_state text not null,
  created_at timestamp with time zone null default now(),
  ended_at timestamp with time zone null,
  constraint Session_pkey primary key (session_id),
  constraint Session_game_state_check check (
    (
      game_state = any (
        array[
          'pre-quiz'::text,
          'active'::text,
          'post-quiz'::text,
          'concluded'::text
        ]
      )
    )
  ),
  constraint Session_phase_check check (
    (
      phase = any (
        array[
          'Setup'::text,
          'Lobby'::text,
          'Full Lobby'::text,
          'In-Progress'::text,
          'Tie-Breaker'::text,
          'Results'::text,
          'Review'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create trigger hash_password_before_insert BEFORE INSERT on "Session" for EACH row
execute FUNCTION hash_host_password ();