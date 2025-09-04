create table public."Score" (
  score_id uuid not null default extensions.uuid_generate_v4 (),
  session_id uuid not null,
  participant_id uuid not null,
  segment_code text not null,
  points integer not null default 0,
  constraint Score_pkey primary key (score_id),
  constraint Score_participant_id_fkey foreign KEY (participant_id) references "Participant" (participant_id) on delete CASCADE,
  constraint Score_session_id_fkey foreign KEY (session_id) references "Session" (session_id) on delete CASCADE,
  constraint Score_segment_code_check check (
    (
      segment_code = any (
        array[
          'WDYK'::text,
          'AUCT'::text,
          'BELL'::text,
          'UPDW'::text,
          'REMO'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;