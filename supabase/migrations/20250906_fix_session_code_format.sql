CREATE OR REPLACE FUNCTION public.generate_session_code()
RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  nums text;
  letters text;
  special_char text;
  all_chars text;
  chars_array text[];
  temp_code text;
  i int;
  j int;
  temp text;
  array_len int;
BEGIN
  -- Generate until we find a unique code
  LOOP
    -- Generate 3 random numbers
    nums := '';
    FOR i IN 1..3 LOOP
      nums := nums || floor(random() * 10)::text;
    END LOOP;

    -- Generate 3 random uppercase letters
    letters := '';
    FOR i IN 1..3 LOOP
      letters := letters || chr(65 + floor(random() * 26)::int);
    END LOOP;

    -- Pick 1 random special character
    special_char := (ARRAY['!', '@', '#', '$', '%', '^', '&', '*', '(', ')'])[1 + floor(random() * 10)::int];

    -- Combine all characters into a single string, then split into array
    all_chars := nums || letters || special_char;
    chars_array := string_to_array(all_chars, '');

    -- Fisher‑Yates shuffle
    array_len := COALESCE(array_length(chars_array, 1), 0);
    IF array_len > 1 THEN
      FOR i IN REVERSE array_len..2 LOOP
        j := 1 + floor(random() * i)::int;
        temp := chars_array[i];
        chars_array[i] := chars_array[j];
        chars_array[j] := temp;
      END LOOP;
    END IF;

    -- Join back to string
    temp_code := array_to_string(chars_array, '');

    -- Check if unique
    IF NOT EXISTS (SELECT 1 FROM "Session" WHERE session_code = temp_code) THEN
      EXIT;
    END IF;
  END LOOP;

  NEW.session_code := temp_code;
  RETURN NEW;
END;
$$;