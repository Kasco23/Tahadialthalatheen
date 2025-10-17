/**
 * Flag Helper - Country Code to Full Name Mapping
 * 
 * Maps country codes (used in flag emojis) to their full English names
 */

export const FLAG_NAMES: Record<string, string> = {
  // Middle East & North Africa
  "sa": "Saudi Arabia",
  "ae": "United Arab Emirates",
  "eg": "Egypt",
  "ma": "Morocco",
  "tn": "Tunisia",
  "dz": "Algeria",
  "jo": "Jordan",
  "lb": "Lebanon",
  "sy": "Syria",
  "iq": "Iraq",
  "ye": "Yemen",
  "om": "Oman",
  "kw": "Kuwait",
  "qa": "Qatar",
  "bh": "Bahrain",
  "ps": "Palestine",
  
  // Europe
  "gb": "United Kingdom",
  "fr": "France",
  "de": "Germany",
  "es": "Spain",
  "it": "Italy",
  "pt": "Portugal",
  "nl": "Netherlands",
  "be": "Belgium",
  "ch": "Switzerland",
  "at": "Austria",
  "se": "Sweden",
  "no": "Norway",
  "dk": "Denmark",
  "fi": "Finland",
  "ie": "Ireland",
  "pl": "Poland",
  "cz": "Czech Republic",
  "gr": "Greece",
  "tr": "Turkey",
  "ru": "Russia",
  "ua": "Ukraine",
  
  // Americas
  "us": "United States",
  "ca": "Canada",
  "mx": "Mexico",
  "br": "Brazil",
  "ar": "Argentina",
  "cl": "Chile",
  "co": "Colombia",
  "pe": "Peru",
  "uy": "Uruguay",
  
  // Asia
  "jp": "Japan",
  "cn": "China",
  "kr": "South Korea",
  "in": "India",
  "th": "Thailand",
  "vn": "Vietnam",
  "id": "Indonesia",
  "my": "Malaysia",
  "sg": "Singapore",
  
  // Africa
  "ng": "Nigeria",
  "za": "South Africa",
  "ke": "Kenya",
  "gh": "Ghana",
  "ci": "Ivory Coast",
  "cm": "Cameroon",
  "sn": "Senegal",
  
  // Oceania
  "au": "Australia",
  "nz": "New Zealand",
};

/**
 * Get full country name from country code
 * @param code - 2-letter country code (e.g., "sa", "ps", "eg")
 * @returns Full country name or the code itself if not found
 */
export function getFlagName(code: string): string {
  const normalizedCode = code.toLowerCase().trim();
  return FLAG_NAMES[normalizedCode] || code.toUpperCase();
}

/**
 * Get country code from full name (reverse lookup)
 * @param name - Full country name
 * @returns 2-letter country code or empty string if not found
 */
export function getCodeFromName(name: string): string {
  const normalizedName = name.toLowerCase().trim();
  const entry = Object.entries(FLAG_NAMES).find(
    ([, value]) => value.toLowerCase() === normalizedName
  );
  return entry ? entry[0] : "";
}

/**
 * Get all available countries as {code, name} pairs
 * Useful for dropdown/selection UI
 */
export function getAllCountries(): Array<{ code: string; name: string }> {
  return Object.entries(FLAG_NAMES)
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
