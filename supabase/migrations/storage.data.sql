SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") VALUES
	('logos', 'logos', NULL, '2025-09-03 10:48:01.182309+00', '2025-09-03 10:48:01.182309+00', true, false, NULL, NULL, NULL, 'STANDARD'),
	('assets', 'assets', NULL, '2025-09-03 10:48:13.271368+00', '2025-09-03 10:48:13.271368+00', true, false, NULL, NULL, NULL, 'STANDARD');


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."objects" ("id", "bucket_id", "name", "owner", "created_at", "updated_at", "last_accessed_at", "metadata", "version", "owner_id", "user_metadata", "level") VALUES
	('2fd86b6f-4226-42c4-a815-e5374d440820', 'logos', 'La Liga/.emptyFolderPlaceholder', NULL, '2025-09-03 18:41:22.706989+00', '2025-09-03 18:41:22.706989+00', '2025-09-03 18:41:22.706989+00', '{"eTag": "\"d41d8cd98f00b204e9800998ecf8427e\"", "size": 0, "mimetype": "application/octet-stream", "cacheControl": "max-age=3600", "lastModified": "2025-09-03T18:41:22.706Z", "contentLength": 0, "httpStatusCode": 200}', '4f20e097-5d45-4224-b39b-9c02168e4fb2', NULL, '{}', 2),
	('90e27f75-bccc-4b73-81ea-d72897d6fa35', 'logos', 'La Liga/real-madrid.svg', NULL, '2025-09-03 18:41:14.167234+00', '2025-09-03 18:41:47.618004+00', '2025-09-03 18:41:14.167234+00', '{"eTag": "\"11a27151642029804dd3dde3bee828f5\"", "size": 31975, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2025-09-03T18:41:48.000Z", "contentLength": 31975, "httpStatusCode": 200}', '4fbe78e9-3624-49ae-99c5-427f0d3b535c', NULL, NULL, 2);


--
-- Data for Name: prefixes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."prefixes" ("bucket_id", "name", "created_at", "updated_at") VALUES
	('logos', 'La Liga', '2025-09-03 18:41:22.706989+00', '2025-09-03 18:41:22.706989+00');


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- PostgreSQL database dump complete
--

RESET ALL;
