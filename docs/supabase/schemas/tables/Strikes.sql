create table public."Strikes" (
  strike_id uuid not null default extensions.uuid_generate_v4 (),
  session_id uuid not null,
  participant_id uuid not null,
  segment_code text not null,
  strikes integer not null default 0,
  constraint Strikes_pkey primary key (strike_id),
  constraint Strikes_participant_id_fkey foreign KEY (participant_id) references "Participant" (participant_id) on delete CASCADE,
  constraint Strikes_session_id_fkey foreign KEY (session_id) references "Session" (session_id) on delete CASCADE,
  constraint Strikes_segment_code_check check ((segment_code = 'WDYK'::text))
) TABLESPACE pg_default;