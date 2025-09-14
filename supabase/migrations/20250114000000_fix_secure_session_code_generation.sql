-- Fix cryptographically weak random number generator in session code generation
-- Replace standard random() with pgcrypto extension functions for secure randomness

-- Drop the existing trigger first, then function
DROP TRIGGER IF EXISTS set_session_code ON public."Session";
DROP FUNCTION IF EXISTS "public"."generate_session_code"() CASCADE;

-- Recreate with cryptographically secure random generation
CREATE OR REPLACE FUNCTION "public"."generate_session_code"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  nums text;
  letters text;
  all_chars text;
  chars_array text[];
  temp_code text;
  i int;
  j int;
  tmp text;
  array_len int;
  random_bytes bytea;
BEGIN
  -- Generate until we find a unique code
  LOOP
    -- Generate 3 random digits using pgcrypto
    nums := '';
    FOR i IN 1..3 LOOP
      -- Use gen_random_bytes for cryptographically secure random
      random_bytes := gen_random_bytes(1);
      nums := nums || (get_byte(random_bytes, 0) % 10)::text;
    END LOOP;

    -- Generate 3 random uppercase letters using pgcrypto
    letters := '';
    FOR i IN 1..3 LOOP
      random_bytes := gen_random_bytes(1);
      letters := letters || chr(65 + (get_byte(random_bytes, 0) % 26));
    END LOOP;

    -- Combine digits + letters (6 chars total)
    all_chars := nums || letters;

    -- Build a 6-element array of single characters
    chars_array := ARRAY[
      substring(all_chars FROM 1 FOR 1),
      substring(all_chars FROM 2 FOR 1),
      substring(all_chars FROM 3 FOR 1),
      substring(all_chars FROM 4 FOR 1),
      substring(all_chars FROM 5 FOR 1),
      substring(all_chars FROM 6 FOR 1)
    ];

    array_len := array_length(chars_array, 1);

    -- Cryptographically secure Fisher–Yates shuffle
    IF array_len IS NOT NULL AND array_len > 1 THEN
      FOR i IN REVERSE 2..array_len LOOP
        -- Use gen_random_bytes for secure random index generation
        random_bytes := gen_random_bytes(1);
        j := 1 + (get_byte(random_bytes, 0) % i);
        tmp := chars_array[i];
        chars_array[i] := chars_array[j];
        chars_array[j] := tmp;
      END LOOP;
    END IF;

    temp_code := array_to_string(chars_array, '');

    -- Ensure uniqueness
    IF NOT EXISTS (SELECT 1 FROM public."Session" WHERE session_code = temp_code) THEN
      NEW.session_code := temp_code;
      RETURN NEW;
    END IF;
    -- otherwise repeat
  END LOOP;
END;
$$;

ALTER FUNCTION "public"."generate_session_code"() OWNER TO "postgres";

-- Recreate the trigger with the correct name
CREATE TRIGGER set_session_code
    BEFORE INSERT ON public."Session"
    FOR EACH ROW
    WHEN (NEW.session_code IS NULL OR NEW.session_code = '')
    EXECUTE FUNCTION public.generate_session_code();