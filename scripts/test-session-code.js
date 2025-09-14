// Quick test to see if the session code generation works
import { supabase } from "../src/lib/supabaseClient.ts";
import { webcrypto } from "node:crypto";

// Cryptographically secure random number generator
const getSecureRandomInt = (max) => {
  const array = new Uint32Array(1);
  webcrypto.getRandomValues(array);
  return array[0] % max;
};

// Cryptographically secure Fisher-Yates shuffle
const secureShuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = getSecureRandomInt(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const generateSessionCode = async () => {
  const numbers = Array.from({ length: 3 }, () =>
    getSecureRandomInt(10).toString(),
  );
  const letters = Array.from({ length: 3 }, () =>
    String.fromCharCode(65 + getSecureRandomInt(26)),
  );
  const specialChars = ["!", "@", "#", "$", "%", "^", "&", "*", "(", ")"];
  const specialChar =
    specialChars[getSecureRandomInt(specialChars.length)];

  const allChars = [...numbers, ...letters, specialChar];
  const shuffled = secureShuffleArray(allChars).join("");

  console.log("Generated code:", shuffled);

  // Ensure uniqueness in the database
  const { data, error } = await supabase
    .from("Session")
    .select("session_code")
    .eq("session_code", shuffled)
    .single();

  console.log("Database check result:", { data, error });

  if (error && error.code === "PGRST116") {
    console.log("Code is unique, returning:", shuffled);
    return shuffled; // Code is unique
  } else if (data) {
    console.log("Code exists, retrying...");
    return generateSessionCode(); // Retry if duplicate
  } else {
    console.error("Unexpected error:", error);
    throw new Error("Error checking session code uniqueness");
  }
};

// Test the function
generateSessionCode()
  .then((code) => console.log("Final code:", code))
  .catch((err) => console.error("Error:", err));
