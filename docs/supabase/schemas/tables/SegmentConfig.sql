create table public."SegmentConfig" (
  config_id uuid not null default extensions.uuid_generate_v4 (),
  session_id uuid not null,
  segment_code text not null,
  questions_count integer not null,
  constraint SegmentConfig_pkey primary key (config_id),
  constraint SegmentConfig_config_id_key unique (config_id),
  constraint SegmentConfig_session_id_segment_code_key unique (session_id, segment_code),
  constraint segmentconfig_sessionid_segmentcode_unique unique (session_id, segment_code),
  constraint SegmentConfig_session_id_fkey foreign KEY (session_id) references "Session" (session_id) on delete CASCADE,
  constraint SegmentConfig_segment_code_check check (
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