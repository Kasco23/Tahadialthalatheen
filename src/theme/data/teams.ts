import type { Team } from '../types';

/**
 * Team data generated from available SVG logos
 * Contains 154 teams from various leagues and national teams
 */

// Helper function to convert kebab-case to proper display name
function formatTeamName(slug: string): string {
  return slug
    .split('-')
    .map((word) => {
      // Handle special cases
      if (word === 'fc') return 'FC';
      if (word === 'ac') return 'AC';
      if (word === 'rc') return 'RC';
      if (word === 'sv') return 'SV';
      if (word === 'vfl') return 'VfL';
      if (word === 'vfb') return 'VfB';
      if (word === 'rb') return 'RB';
      if (word === 'as') return 'AS';
      if (word === 'dfb') return 'DFB';
      if (word === 'v2') return 'v2';
      if (word === '1907') return '1907';
      if (word === '04') return '04';
      if (word === '05') return '05';
      if (word === '96') return '96';

      // Capitalize first letter
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

// Helper function to generate search terms
function generateSearchTerms(
  name: string,
  displayName: string,
  league: string,
): string[] {
  const terms = [
    name.toLowerCase(),
    displayName.toLowerCase(),
    league.toLowerCase(),
    ...name.toLowerCase().split(' '),
    ...displayName.toLowerCase().split(' '),
  ];
  return [...new Set(terms)]; // Remove duplicates
}

// Helper function to determine team category
function getTeamCategory(slug: string): Team['category'] {
  if (slug.includes('national-team') || slug.includes('-national-team'))
    return 'national';
  if (
    slug.includes('league') ||
    slug.includes('ligue') ||
    slug.includes('bundesliga') ||
    slug.includes('serie-a') ||
    slug.includes('la-liga') ||
    slug.includes('dfb') ||
    slug.includes('english-football-league') ||
    slug.includes('emirates-fa-cup') ||
    slug.includes('french-football-federation')
  )
    return 'league';
  return 'club';
}

// Helper function to determine league
function getTeamLeague(slug: string): string {
  if (
    slug.includes('premier-league') ||
    [
      'arsenal',
      'chelsea',
      'liverpool',
      'manchester-city',
      'manchester-united',
      'tottenham',
      'newcastle',
      'aston-villa',
      'brighton',
      'west-ham',
      'crystal-palace',
      'fulham',
      'wolves',
      'everton',
      'brentford',
      'nottingham-forest',
      'luton-town',
      'burnley',
      'sheffield-united',
      'bournemouth',
      'leicester',
      'ipswich',
      'southampton',
      'watford',
    ].includes(slug)
  ) {
    return 'Premier League';
  }
  if (
    slug.includes('la-liga') ||
    [
      'barcelona',
      'real-madrid',
      'atletico-madrid',
      'sevilla',
      'valencia',
      'villarreal',
      'real-betis',
      'real-sociedad',
      'athletic-club',
      'espanyol',
      'celta',
      'getafe',
      'osasuna',
      'mallorca',
      'rayo-vallecano',
      'girona',
      'las-palmas',
      'leganes',
      'valladolid',
      'deportivo',
    ].includes(slug)
  ) {
    return 'La Liga';
  }
  if (
    slug.includes('bundesliga') ||
    [
      'bayern-munchen',
      'borussia-dortmund',
      'rb-leipzig',
      'bayer-leverkusen',
      'borussia-monchengladbach',
      'hoffenheim',
      'wolfsburg',
      'eintracht-frankfurt',
      'freiburg',
      'union-berlin',
      'mainz-05',
      'vfb-stuttgart',
      'werder-bremen',
      'augsburg',
      'vfl-bochum',
      'fc-heidenheim',
      'hertha-bsc',
      'schalke-04',
      'hamburger-sv',
      'hannover-96',
      'fc-kaiserslautern',
      'fortuna-dusseldorf',
      'fc-nurnberg',
      'holstein-kiel',
      'st-pauli',
      'arminia-bielefeld',
      'dynamo-dresden',
      'energie-cottbus',
      'sv-sandhausen',
      'alemannia-aachen',
      'hansa-rostock',
    ].includes(slug)
  ) {
    return 'Bundesliga';
  }
  if (
    slug.includes('serie-a') ||
    [
      'juventus',
      'inter',
      'milan',
      'napoli',
      'roma',
      'lazio',
      'atalanta',
      'fiorentina',
      'torino',
      'bologna',
      'udinese',
      'genoa',
      'verona',
      'empoli',
      'lecce',
      'monza',
      'cagliari',
      'venezia',
      'parma',
      'como-1907',
    ].includes(slug)
  ) {
    return 'Serie A';
  }
  if (
    slug.includes('ligue') ||
    [
      'paris-saint-germain',
      'marseille',
      'lyon',
      'monaco',
      'lille',
      'rennes',
      'nice',
      'lens',
      'toulouse',
      'montpellier',
      'nantes',
      'brest',
      'angers',
      'strasbourg',
      'le-havre',
      'auxerre',
      'reims',
      'metz',
      'saint-etienne',
    ].includes(slug)
  ) {
    return 'Ligue 1';
  }
  if (
    [
      'coventry-city',
      'hull-city',
      'middlesbrough',
      'norwich-city',
      'sheffield-wednesday',
      'cardiff-city',
      'swansea-city',
      'blackburn-rovers',
      'preston-north-end',
      'bristol-city',
      'millwall',
      'queens-park-rangers',
      'stoke-city',
      'west-bromwich-albion',
      'derby-county',
      'oxford-united',
      'plymouth-argyle',
      'portsmouth',
      'sunderland',
      'leeds-united',
    ].includes(slug)
  ) {
    return 'Championship';
  }
  if (slug.includes('national-team')) {
    return 'International';
  }
  return 'Other';
}

// Team data with hardcoded color palettes - no logo loading logic in this file
// Logo loading is handled separately to avoid import.meta issues in tests

// Cache for loaded logos to avoid repeated dynamic imports
const logoCache = new Map<string, string>();

// Generate teams data from available logo files (logos loaded on-demand)
// Hardcoded color palettes for each team based on their logos
const teamColorPalettes: Record<
  string,
  { colors: string[]; weights: number[] }
> = {
  // Premier League
  arsenal: {
    colors: ['#EF0107', '#9C824A', '#023474'],
    weights: [0.5, 0.3, 0.2],
  },
  chelsea: {
    colors: ['#001489', '#DBA111', '#FFFFFF'],
    weights: [0.6, 0.25, 0.15],
  },
  liverpool: {
    colors: ['#E51C25', '#00529F', '#FFD700'],
    weights: [0.5, 0.35, 0.15],
  },
  'manchester-united': {
    colors: ['#DA020E', '#FFE500', '#000000'],
    weights: [0.5, 0.3, 0.2],
  },
  'manchester-city': {
    colors: ['#5CBDED', '#1C2C5B', '#FFFFFF'],
    weights: [0.5, 0.3, 0.2],
  },
  tottenham: {
    colors: ['#132257', '#FFFFFF', '#1C2C5B'],
    weights: [0.5, 0.3, 0.2],
  },
  newcastle: {
    colors: ['#000000', '#FFFFFF', '#FFCC00'],
    weights: [0.5, 0.3, 0.2],
  },
  'aston-villa': {
    colors: ['#95BFE5', '#670E36', '#FFFF00'],
    weights: [0.4, 0.4, 0.2],
  },
  'west-ham': {
    colors: ['#7A263A', '#1BB1E7', '#F3D459'],
    weights: [0.4, 0.35, 0.25],
  },
  leicester: {
    colors: ['#003090', '#FDBE11', '#FFFFFF'],
    weights: [0.5, 0.3, 0.2],
  },
  everton: {
    colors: ['#003399', '#FFFFFF', '#000000'],
    weights: [0.6, 0.25, 0.15],
  },
  brighton: {
    colors: ['#0057B8', '#FFCD00', '#FFFFFF'],
    weights: [0.5, 0.3, 0.2],
  },
  'crystal-palace': {
    colors: ['#1B458F', '#C4122E', '#A7A5A6'],
    weights: [0.4, 0.4, 0.2],
  },
  fulham: {
    colors: ['#000000', '#FFFFFF', '#CC0000'],
    weights: [0.5, 0.3, 0.2],
  },
  wolves: {
    colors: ['#FDB462', '#231F20', '#FFFFFF'],
    weights: [0.5, 0.3, 0.2],
  },
  brentford: {
    colors: ['#E30613', '#FFD100', '#000000'],
    weights: [0.5, 0.3, 0.2],
  },
  'nottingham-forest': {
    colors: ['#DD0000', '#FFFFFF', '#000000'],
    weights: [0.6, 0.25, 0.15],
  },
  'luton-town': {
    colors: ['#F78F1E', '#002D62', '#FFFFFF'],
    weights: [0.4, 0.4, 0.2],
  },
  burnley: {
    colors: ['#6C1D45', '#99D6EA', '#FFFFFF'],
    weights: [0.5, 0.3, 0.2],
  },
  'sheffield-united': {
    colors: ['#EE2737', '#000000', '#FFFFFF'],
    weights: [0.5, 0.3, 0.2],
  },
  bournemouth: {
    colors: ['#DA020E', '#000000', '#FFFFFF'],
    weights: [0.5, 0.3, 0.2],
  },

  // La Liga
  barcelona: {
    colors: ['#A50044', '#004D98', '#EDBB00'],
    weights: [0.4, 0.35, 0.25],
  },
  'real-madrid': {
    colors: ['#FEBE10', '#00529F', '#FFFFFF'],
    weights: [0.4, 0.35, 0.25],
  },
  'atletico-madrid': {
    colors: ['#CE3524', '#143F90', '#FFFFFF'],
    weights: [0.5, 0.3, 0.2],
  },
  sevilla: {
    colors: ['#D50000', '#FFFFFF', '#000000'],
    weights: [0.6, 0.25, 0.15],
  },
  valencia: {
    colors: ['#FF7900', '#000000', '#FFFFFF'],
    weights: [0.5, 0.3, 0.2],
  },
  villarreal: {
    colors: ['#FFE500', '#005CA9', '#FFFFFF'],
    weights: [0.5, 0.3, 0.2],
  },
  'real-betis': {
    colors: ['#00954C', '#FFFFFF', '#000000'],
    weights: [0.6, 0.25, 0.15],
  },
  'real-sociedad': {
    colors: ['#004791', '#FFFFFF', '#FF6600'],
    weights: [0.5, 0.3, 0.2],
  },
  'athletic-club': {
    colors: ['#EE2737', '#FFFFFF', '#000000'],
    weights: [0.5, 0.3, 0.2],
  },
  espanyol: {
    colors: ['#007FFF', '#FFFFFF', '#004785'],
    weights: [0.5, 0.3, 0.2],
  },
  celta: {
    colors: ['#87CEEB', '#FFFFFF', '#004D9F'],
    weights: [0.5, 0.3, 0.2],
  },
  getafe: {
    colors: ['#005CA9', '#FFFFFF', '#C8102E'],
    weights: [0.5, 0.3, 0.2],
  },
  osasuna: {
    colors: ['#D50000', '#000080', '#FFFFFF'],
    weights: [0.4, 0.35, 0.25],
  },
  mallorca: {
    colors: ['#E30613', '#FFD100', '#000000'],
    weights: [0.5, 0.3, 0.2],
  },
  'rayo-vallecano': {
    colors: ['#FFFFFF', '#E30613', '#000000'],
    weights: [0.4, 0.4, 0.2],
  },
  girona: {
    colors: ['#C8102E', '#FFFFFF', '#004D9F'],
    weights: [0.5, 0.3, 0.2],
  },

  // Bundesliga
  'bayern-munchen': {
    colors: ['#DC052D', '#0066B2', '#FFFFFF'],
    weights: [0.5, 0.3, 0.2],
  },
  'borussia-dortmund': {
    colors: ['#FDE100', '#000000', '#FFFFFF'],
    weights: [0.5, 0.3, 0.2],
  },
  'rb-leipzig': {
    colors: ['#DD0741', '#FFFFFF', '#000000'],
    weights: [0.6, 0.25, 0.15],
  },
  'bayer-leverkusen': {
    colors: ['#E32221', '#000000', '#FFFFFF'],
    weights: [0.6, 0.25, 0.15],
  },
  'borussia-monchengladbach': {
    colors: ['#00B04F', '#000000', '#FFFFFF'],
    weights: [0.6, 0.25, 0.15],
  },
  hoffenheim: {
    colors: ['#1961AA', '#FFFFFF', '#000000'],
    weights: [0.6, 0.25, 0.15],
  },
  wolfsburg: {
    colors: ['#65B32E', '#FFFFFF', '#000000'],
    weights: [0.6, 0.25, 0.15],
  },
  'eintracht-frankfurt': {
    colors: ['#E1000F', '#000000', '#FFFFFF'],
    weights: [0.5, 0.3, 0.2],
  },
  freiburg: {
    colors: ['#E30613', '#FFFFFF', '#000000'],
    weights: [0.6, 0.25, 0.15],
  },
  'union-berlin': {
    colors: ['#EB1923', '#FFFFFF', '#8B4513'],
    weights: [0.5, 0.3, 0.2],
  },
  'mainz-05': {
    colors: ['#C8102E', '#FFFFFF', '#000000'],
    weights: [0.6, 0.25, 0.15],
  },
  'vfb-stuttgart': {
    colors: ['#FFFFFF', '#E32221', '#000000'],
    weights: [0.4, 0.4, 0.2],
  },
  'werder-bremen': {
    colors: ['#00A65E', '#FFFFFF', '#000000'],
    weights: [0.6, 0.25, 0.15],
  },
  augsburg: {
    colors: ['#BA0C2F', '#FFFFFF', '#006634'],
    weights: [0.4, 0.35, 0.25],
  },
  'vfl-bochum': {
    colors: ['#005CA9', '#FFFFFF', '#000000'],
    weights: [0.6, 0.25, 0.15],
  },
  'schalke-04': {
    colors: ['#004D9F', '#FFFFFF', '#000000'],
    weights: [0.6, 0.25, 0.15],
  },
  'hamburger-sv': {
    colors: ['#003087', '#FFFFFF', '#E30613'],
    weights: [0.5, 0.3, 0.2],
  },
  'hannover-96': {
    colors: ['#E30613', '#000000', '#FFFFFF'],
    weights: [0.6, 0.25, 0.15],
  },

  // Serie A
  juventus: {
    colors: ['#000000', '#FFFFFF', '#FFFF00'],
    weights: [0.5, 0.3, 0.2],
  },
  inter: {
    colors: ['#0068A8', '#000000', '#FFFFFF'],
    weights: [0.5, 0.3, 0.2],
  },
  milan: {
    colors: ['#FB090B', '#000000', '#FFFFFF'],
    weights: [0.5, 0.3, 0.2],
  },
  napoli: {
    colors: ['#007FFF', '#FFFFFF', '#000000'],
    weights: [0.6, 0.25, 0.15],
  },
  roma: { colors: ['#732F2A', '#F7DC6F', '#FFFFFF'], weights: [0.5, 0.3, 0.2] },
  lazio: {
    colors: ['#87CEEB', '#FFFFFF', '#000080'],
    weights: [0.5, 0.3, 0.2],
  },
  atalanta: {
    colors: ['#1C63B7', '#000000', '#FFFFFF'],
    weights: [0.6, 0.25, 0.15],
  },
  fiorentina: {
    colors: ['#6A0D83', '#FFFFFF', '#000000'],
    weights: [0.6, 0.25, 0.15],
  },
  torino: {
    colors: ['#732F2A', '#FFFFFF', '#FFD700'],
    weights: [0.5, 0.3, 0.2],
  },
  bologna: {
    colors: ['#0E4B91', '#E30613', '#FFFFFF'],
    weights: [0.4, 0.35, 0.25],
  },
  udinese: {
    colors: ['#000000', '#FFFFFF', '#F7DC6F'],
    weights: [0.5, 0.3, 0.2],
  },
  genoa: {
    colors: ['#E30613', '#000080', '#FFFFFF'],
    weights: [0.5, 0.3, 0.2],
  },
  verona: {
    colors: ['#002654', '#FDE100', '#FFFFFF'],
    weights: [0.5, 0.3, 0.2],
  },
  empoli: {
    colors: ['#004D9F', '#FFFFFF', '#000000'],
    weights: [0.6, 0.25, 0.15],
  },
  lecce: {
    colors: ['#FFD700', '#E30613', '#FFFFFF'],
    weights: [0.4, 0.35, 0.25],
  },
  monza: {
    colors: ['#E30613', '#FFFFFF', '#000000'],
    weights: [0.6, 0.25, 0.15],
  },
  cagliari: {
    colors: ['#E30613', '#004D9F', '#FFFFFF'],
    weights: [0.5, 0.3, 0.2],
  },
  venezia: {
    colors: ['#F7941D', '#000000', '#00B04F'],
    weights: [0.4, 0.35, 0.25],
  },
  parma: {
    colors: ['#FFCC00', '#004D9F', '#FFFFFF'],
    weights: [0.5, 0.3, 0.2],
  },
  'como-1907': {
    colors: ['#004D9F', '#FFFFFF', '#E30613'],
    weights: [0.5, 0.3, 0.2],
  },

  // Ligue 1
  'paris-saint-germain': {
    colors: ['#004170', '#E30613', '#FFFFFF'],
    weights: [0.5, 0.3, 0.2],
  },
  marseille: {
    colors: ['#009CDA', '#FFFFFF', '#000000'],
    weights: [0.6, 0.25, 0.15],
  },
  lyon: { colors: ['#004D9F', '#FFFFFF', '#E30613'], weights: [0.5, 0.3, 0.2] },
  'as-monaco': {
    colors: ['#C8102E', '#FFFFFF', '#000000'],
    weights: [0.6, 0.25, 0.15],
  },
  lille: {
    colors: ['#E30613', '#FFFFFF', '#004170'],
    weights: [0.5, 0.3, 0.2],
  },
  rennes: {
    colors: ['#E30613', '#000000', '#FFFFFF'],
    weights: [0.6, 0.25, 0.15],
  },
  nice: {
    colors: ['#E30613', '#000000', '#FFFFFF'],
    weights: [0.6, 0.25, 0.15],
  },
  'rc-lens': {
    colors: ['#FFD700', '#E30613', '#000000'],
    weights: [0.4, 0.35, 0.25],
  },
  toulouse: {
    colors: ['#6A1B8A', '#FFFFFF', '#000000'],
    weights: [0.6, 0.25, 0.15],
  },
  montpellier: {
    colors: ['#F7941D', '#004D9F', '#FFFFFF'],
    weights: [0.4, 0.35, 0.25],
  },
  nantes: {
    colors: ['#FFD700', '#00B04F', '#FFFFFF'],
    weights: [0.4, 0.35, 0.25],
  },
  brest: {
    colors: ['#E30613', '#FFFFFF', '#004D9F'],
    weights: [0.5, 0.3, 0.2],
  },
  angers: {
    colors: ['#000000', '#FFFFFF', '#E30613'],
    weights: [0.5, 0.3, 0.2],
  },
  'rc-strasbourg-alsace': {
    colors: ['#007FFF', '#FFFFFF', '#000000'],
    weights: [0.6, 0.25, 0.15],
  },
  'le-havre-ac': {
    colors: ['#007FFF', '#FFFFFF', '#FFD700'],
    weights: [0.5, 0.3, 0.2],
  },
  auxerre: {
    colors: ['#FFFFFF', '#004D9F', '#FFD700'],
    weights: [0.4, 0.35, 0.25],
  },
  'stade-de-reims': {
    colors: ['#E30613', '#FFFFFF', '#000000'],
    weights: [0.6, 0.25, 0.15],
  },
  'fc-metz': {
    colors: ['#732F2A', '#FFD700', '#FFFFFF'],
    weights: [0.5, 0.3, 0.2],
  },
  'as-saint-etienne': {
    colors: ['#00B04F', '#FFFFFF', '#000000'],
    weights: [0.6, 0.25, 0.15],
  },

  // National Teams
  'england-national-team': {
    colors: ['#FFFFFF', '#012169', '#C8102E'],
    weights: [0.4, 0.35, 0.25],
  },
  'france-national-team': {
    colors: ['#002654', '#FFFFFF', '#ED2939'],
    weights: [0.4, 0.35, 0.25],
  },
  'germany-national-team': {
    colors: ['#000000', '#DD0000', '#FFD700'],
    weights: [0.4, 0.35, 0.25],
  },
  'spain-national-team': {
    colors: ['#C60B1E', '#FFD700', '#FFFFFF'],
    weights: [0.5, 0.3, 0.2],
  },
  'italy-national-team': {
    colors: ['#009246', '#FFFFFF', '#CE2B37'],
    weights: [0.4, 0.35, 0.25],
  },

  // Default fallback for unknown teams
  default: {
    colors: ['#1f2937', '#374151', '#60a5fa'],
    weights: [0.4, 0.4, 0.2],
  },
};

export const teams: Team[] = Object.keys(teamColorPalettes)
  .filter((slug) => slug !== 'default') // Exclude the default fallback
  .map((slug) => {
    const name = formatTeamName(slug);
    const displayName = name;
    const league = getTeamLeague(slug);
    const category = getTeamCategory(slug);

    // Get hardcoded color palette for this team
    const colorPalette = teamColorPalettes[slug];

    return {
      id: slug,
      name,
      displayName,
      slug,
      logoPath: '', // Will be loaded lazily when needed
      searchTerms: generateSearchTerms(name, displayName, league),
      league,
      category,
      // Use hardcoded colors instead of dynamic extraction
      primaryColor: colorPalette.colors[0],
      secondaryColor: colorPalette.colors[1] || colorPalette.colors[0],
      accentColor:
        colorPalette.colors[2] ||
        colorPalette.colors[1] ||
        colorPalette.colors[0],
    };
  });

/**
 * Get hardcoded color palette for a specific team
 */
export function getTeamColorPalette(teamId: string): {
  colors: string[];
  weights: number[];
} {
  return teamColorPalettes[teamId] || teamColorPalettes['default'];
}

/**
 * Load logo URL for a specific team (lazy loaded)
 */
export async function loadTeamLogo(teamId: string): Promise<string> {
  if (logoCache.has(teamId)) {
    const cachedLogo = logoCache.get(teamId);
    return cachedLogo || '';
  }

  try {
    // In test environment, return mock URL
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
      const mockUrl = `mock-${teamId}-logo-url`;
      logoCache.set(teamId, mockUrl);
      return mockUrl;
    }

    // In browser environment, use dynamic import
    const logoModule = await import(`../../assets/logos/${teamId}.svg?url`);
    const logoUrl = logoModule.default;
    logoCache.set(teamId, logoUrl);
    return logoUrl;
  } catch (error) {
    console.warn(`Failed to load logo for team: ${teamId}`, error);
    return '';
  }
}

// Group teams by category for easier filtering
export const teamsByCategory = {
  clubs: teams.filter((team) => team.category === 'club'),
  national: teams.filter((team) => team.category === 'national'),
  leagues: teams.filter((team) => team.category === 'league'),
};

// Group teams by league for league-specific filtering
export const teamsByLeague = teams.reduce(
  (acc, team) => {
    if (!acc[team.league]) {
      acc[team.league] = [];
    }
    acc[team.league].push(team);
    return acc;
  },
  {} as Record<string, Team[]>,
);

// Popular teams for quick access
export const popularTeams = teams.filter((team) =>
  [
    'barcelona',
    'real-madrid',
    'manchester-united',
    'manchester-city',
    'liverpool',
    'arsenal',
    'chelsea',
    'tottenham',
    'bayern-munchen',
    'borussia-dortmund',
    'paris-saint-germain',
    'juventus',
    'inter',
    'milan',
    'napoli',
  ].includes(team.id),
);

export default teams;
