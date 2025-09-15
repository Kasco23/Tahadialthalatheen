import { useFlagIcons } from "../lib/flagIcons";

// Map custom flag codes to standard ISO codes
const flagCodeMap: Record<string, string> = {
  PS: "ps", // Palestine
  SA: "sa", // Saudi Arabia
  AE: "ae", // UAE
  EG: "eg", // Egypt
  JO: "jo", // Jordan
  LB: "lb", // Lebanon
  SY: "sy", // Syria
  IQ: "iq", // Iraq
  KW: "kw", // Kuwait
  QA: "qa", // Qatar
  BH: "bh", // Bahrain
  OM: "om", // Oman
  YE: "ye", // Yemen
  MA: "ma", // Morocco
  TN: "tn", // Tunisia
  DZ: "dz", // Algeria
  LY: "ly", // Libya
  SD: "sd", // Sudan
};

/**
 * Flag component that loads flag-icons CSS on demand
 */
export const Flag: React.FC<{
  code: string;
  className?: string;
}> = ({ code, className = "" }) => {
  const loaded = useFlagIcons();

  if (!loaded) {
    // Return a placeholder while loading
    return (
      <span
        className={`inline-block w-6 h-4 bg-gray-300 rounded ${className}`}
        title="Loading flag..."
      ></span>
    );
  }

  if (!code) {
    // Return a default flag if no code provided
    return (
      <span className={`fi fi-sa ${className}`} title="Default flag"></span>
    );
  }

  // Convert code to lowercase and use mapping if available
  const normalizedCode = code.toUpperCase();
  const flagCode = flagCodeMap[normalizedCode] || code.toLowerCase();

  return (
    <span
      className={`fi fi-${flagCode} ${className}`}
      title={`Flag: ${normalizedCode}`}
    ></span>
  );
};
