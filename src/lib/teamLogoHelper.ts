/**
 * Team Logo Storage Helper
 *
 * Handles team logo URL generation from Supabase Storage bucket 'logos'
 * Structure: /logos/{League-Name}/{team-name}.svg
 *
 * Example:
 * - Real Madrid → /logos/La-Liga/real-madrid.svg
 * - Manchester United → /logos/Premier-League/manchester-united.svg
 */

import { supabase } from "./supabaseClient";

// League mappings for popular teams
const TEAM_TO_LEAGUE: Record<string, string> = {
  // La Liga
  "real madrid": "La-Liga",
  barcelona: "La-Liga",
  "atletico madrid": "La-Liga",
  sevilla: "La-Liga",
  valencia: "La-Liga",
  villarreal: "La-Liga",
  "real sociedad": "La-Liga",
  "athletic bilbao": "La-Liga",
  "real betis": "La-Liga",

  // Premier League
  "manchester united": "Premier-League",
  "manchester city": "Premier-League",
  liverpool: "Premier-League",
  chelsea: "Premier-League",
  arsenal: "Premier-League",
  "tottenham hotspur": "Premier-League",
  "newcastle united": "Premier-League",
  "west ham united": "Premier-League",
  "aston villa": "Premier-League",
  brighton: "Premier-League",

  // Serie A
  juventus: "Serie-A",
  "inter milan": "Serie-A",
  "ac milan": "Serie-A",
  napoli: "Serie-A",
  roma: "Serie-A",
  lazio: "Serie-A",
  atalanta: "Serie-A",
  fiorentina: "Serie-A",

  // Bundesliga
  "bayern munich": "Bundesliga",
  "borussia dortmund": "Bundesliga",
  "rb leipzig": "Bundesliga",
  "bayer leverkusen": "Bundesliga",
  "union berlin": "Bundesliga",

  // Ligue 1
  psg: "Ligue-1",
  "paris saint-germain": "Ligue-1",
  marseille: "Ligue-1",
  lyon: "Ligue-1",
  monaco: "Ligue-1",

  // Saudi Pro League
  "al-nassr": "Saudi-Pro-League",
  "al-hilal": "Saudi-Pro-League",
  "al-ittihad": "Saudi-Pro-League",
  "al-ahli": "Saudi-Pro-League",
};

/**
 * Convert team name to kebab-case for file names
 * Example: "Real Madrid" → "real-madrid"
 */
export function teamNameToKebabCase(teamName: string): string {
  return teamName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
}

/**
 * Get league name for a team
 * Returns null if team not found in mapping
 */
export function getLeagueForTeam(teamName: string): string | null {
  const normalizedName = teamName.toLowerCase().trim();
  return TEAM_TO_LEAGUE[normalizedName] || null;
}

/**
 * Generate full Storage URL for a team logo
 *
 * @param teamName - Display name of team (e.g., "Real Madrid")
 * @param league - Optional league name, will be auto-detected if not provided
 * @returns Full Supabase Storage URL or null if team not found
 */
export function getTeamLogoUrl(
  teamName: string,
  league?: string,
): string | null {
  const detectedLeague = league || getLeagueForTeam(teamName);

  if (!detectedLeague) {
    console.warn(`League not found for team: ${teamName}`);
    return null;
  }

  const kebabName = teamNameToKebabCase(teamName);
  const { data } = supabase.storage
    .from("logos")
    .getPublicUrl(`${detectedLeague}/${kebabName}.svg`);

  return data.publicUrl;
}

/**
 * Get all available teams from a specific league
 * Useful for populating team selection dropdowns
 *
 * @param league - League folder name (e.g., "La-Liga")
 * @returns Array of team names and URLs
 */
export async function getTeamsFromLeague(
  league: string,
): Promise<Array<{ name: string; displayName: string; url: string }>> {
  try {
    const { data, error } = await supabase.storage.from("logos").list(league);

    if (error) {
      console.error(`Error listing teams from ${league}:`, error);
      return [];
    }

    return (data || [])
      .filter((file) => file.name.endsWith(".svg"))
      .map((file) => {
        const name = file.name.replace(".svg", "");
        const displayName = name
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        const { data: urlData } = supabase.storage
          .from("logos")
          .getPublicUrl(`${league}/${file.name}`);

        return {
          name,
          displayName,
          url: urlData.publicUrl,
        };
      });
  } catch (err) {
    console.error(`Error fetching teams from ${league}:`, err);
    return [];
  }
}

/**
 * Get all available leagues from Storage bucket
 * Returns array of league folder names
 */
export async function getAvailableLeagues(): Promise<string[]> {
  try {
    const { data, error } = await supabase.storage.from("logos").list();

    if (error) {
      console.error("Error listing leagues:", error);
      return [];
    }

    return (data || [])
      .filter((folder) => folder.id) // Only folders
      .map((folder) => folder.name);
  } catch (err) {
    console.error("Error fetching available leagues:", err);
    return [];
  }
}

/**
 * Get all teams from all leagues
 * Useful for building complete team selection UI
 */
export async function getAllTeams(): Promise<
  Record<string, Array<{ name: string; displayName: string; url: string }>>
> {
  const leagues = await getAvailableLeagues();
  const result: Record<
    string,
    Array<{ name: string; displayName: string; url: string }>
  > = {};

  for (const league of leagues) {
    result[league] = await getTeamsFromLeague(league);
  }

  return result;
}
