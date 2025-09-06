-- Update session code generation to 7 characters: 3 letters, 3 numbers, 1 special character

CREATE OR REPLACE FUNCTION "public"."generate_session_code"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
  letters text[] := array['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
  numbers text[] := array['0','1','2','3','4','5','6','7','8','9'];
  special_chars text[] := array['!','@','#','$','%','&','*','+','=','?'];
  code_parts text[];
  final_code text := '';
  i integer;
  temp_code text;
  is_unique boolean := false;
begin
  -- Keep generating until we get a unique code
  while not is_unique loop
    -- Generate 3 letters, 3 numbers, 1 special character
    code_parts := array[
      letters[1 + floor(random() * array_length(letters, 1))::int],
      letters[1 + floor(random() * array_length(letters, 1))::int],
      letters[1 + floor(random() * array_length(letters, 1))::int],
      numbers[1 + floor(random() * array_length(numbers, 1))::int],
      numbers[1 + floor(random() * array_length(numbers, 1))::int],
      numbers[1 + floor(random() * array_length(numbers, 1))::int],
      special_chars[1 + floor(random() * array_length(special_chars, 1))::int]
    ];
    
    -- Shuffle the array to randomize order
    for i in 1..7 loop
      declare
        j integer := 1 + floor(random() * 7)::int;
        temp text := code_parts[i];
      begin
        code_parts[i] := code_parts[j];
        code_parts[j] := temp;
      end;
    end loop;
    
    -- Join the parts
    temp_code := array_to_string(code_parts, '');
    
    -- Check if this code already exists
    select not exists(
      select 1 from "Session" where session_code = temp_code
    ) into is_unique;
  end loop;
  
  new.session_code := temp_code;
  return new;
end;
$$;