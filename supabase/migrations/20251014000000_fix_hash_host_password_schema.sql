-- Fix hash_host_password function to properly reference pgcrypto functions
-- The gen_salt() and crypt() functions are in the extensions schema, not public
-- This migration adds the proper search_path to resolve the function references

CREATE OR REPLACE FUNCTION "public"."hash_host_password"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET search_path = 'public, extensions'
    AS $_$
begin
  -- Hash only if it's not already hashed (safety check)
  if new.host_password not like '$2a$%' then
    new.host_password := crypt(new.host_password, gen_salt('bf'));
  end if;
  return new;
end;
$_$;

ALTER FUNCTION "public"."hash_host_password"() OWNER TO "postgres";

-- Grant necessary permissions (maintaining existing grants)
GRANT ALL ON FUNCTION "public"."hash_host_password"() TO "anon";
GRANT ALL ON FUNCTION "public"."hash_host_password"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."hash_host_password"() TO "service_role";
