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

// Get all logo files from the assets/logos directory
const logoModules = import.meta.glob('../../assets/logos/*.svg', { eager: true, query: '?url', import: 'default' });

export const teams: Team[] = Object.entries(logoModules).map(([path, url]) => {
  // Extract team slug from file path (e.g., "../../assets/logos/real-madrid.svg" -> "real-madrid")
  const slug = path.split('/').pop()?.replace('.svg', '') || '';
  
  const name = formatTeamName(slug);
  const displayName = name;
  const league = getTeamLeague(slug);
  const category = getTeamCategory(slug);

  return {
    id: slug,
    name,
    displayName,
    slug,
    logoPath: url as string,
    searchTerms: generateSearchTerms(name, displayName, league),
    league,
    category,
    // Default colors - will be extracted dynamically from logos
    primaryColor: '#1f2937',
    secondaryColor: '#374151',
    accentColor: '#60a5fa',
  };
});

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
