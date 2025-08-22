// Get all logo files from the assets/logos directory as URLs (lazy loaded)
const logoModules = import.meta.glob('@/assets/logos/*.svg', {
  query: '?url',
  import: 'default',
}) as Record<string, () => Promise<string>>;

export interface Team {
  name: string;
  displayName: string;
  logoPath: string;
  searchTerms: string[];
}

// Cache for loaded logos
const logoCache = new Map<string, string>();

export async function getAllTeams(): Promise<Team[]> {
  const teams: Team[] = [];

  for (const path in logoModules) {
    const logoLoader = logoModules[path];
    // Extract team name from file path (e.g., "@/assets/logos/real-madrid.svg" -> "real-madrid")
    const fileName = path.split('/').pop()?.replace('.svg', '') || '';

    // Convert kebab-case to Title Case (e.g., "real-madrid" -> "Real Madrid")
    const displayName = fileName
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // Load the logo URL
    let logoPath = '';
    if (logoCache.has(fileName)) {
      logoPath = logoCache.get(fileName) || '';
    } else {
      logoPath = await logoLoader();
      logoCache.set(fileName, logoPath);
    }

    teams.push({
      name: fileName,
      displayName,
      logoPath,
      searchTerms: [
        fileName,
        displayName.toLowerCase(),
        ...fileName.split('-'),
      ],
    });
  }

  // Sort teams alphabetically by display name
  return teams.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export function searchTeams(teams: Team[], query: string): Team[] {
  if (!query.trim()) return teams;

  const searchTerm = query.toLowerCase();
  return teams.filter((team) =>
    team.searchTerms.some((term) => term.includes(searchTerm)),
  );
}

// Common Arab country flags for the join page
export const COMMON_FLAGS = [
  { code: 'sa', name: 'السعودية' },
  { code: 'ae', name: 'الإمارات' },
  { code: 'eg', name: 'مصر' },
  { code: 'jo', name: 'الأردن' },
  { code: 'lb', name: 'لبنان' },
  { code: 'sy', name: 'سوريا' },
  { code: 'iq', name: 'العراق' },
  { code: 'kw', name: 'الكويت' },
  { code: 'qa', name: 'قطر' },
  { code: 'bh', name: 'البحرين' },
  { code: 'om', name: 'عمان' },
  { code: 'ye', name: 'اليمن' },
  { code: 'ps', name: 'فلسطين' },
  { code: 'ma', name: 'المغرب' },
  { code: 'tn', name: 'تونس' },
  { code: 'dz', name: 'الجزائر' },
  { code: 'ly', name: 'ليبيا' },
  { code: 'sd', name: 'السودان' },
  { code: 'so', name: 'الصومال' },
  { code: 'dj', name: 'جيبوتي' },
  { code: 'km', name: 'جزر القمر' },
  { code: 'mr', name: 'موريتانيا' },
];

export function searchFlags(query: string) {
  if (!query.trim()) return COMMON_FLAGS;

  const searchTerm = query.toLowerCase();
  return COMMON_FLAGS.filter(
    (flag) => flag.name.includes(searchTerm) || flag.code.includes(searchTerm),
  );
}
