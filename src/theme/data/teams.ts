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

const teamSlugs = [
  'athletic-club',
  'liverpool',
  'milan',
  'nottingham-forest',
  'lyon',
  'national',
  'paris-saint-germain',
  'sunderland',
  'bologna',
  'villarreal',
  'swansea-city',
  'italy-national-team',
  'valladolid',
  'germany-national-team',
  'napoli',
  'ligue-2',
  'bristol-city',
  'union-berlin',
  'hansa-rostock',
  'bayern-munchen',
  'freiburg',
  'lecce',
  'werder-bremen',
  'bundesliga',
  'vfl-bochum',
  'fc-metz',
  'west-ham',
  'hertha-bsc',
  'english-football-league',
  'ligue-1',
  'torino',
  'verona',
  'fc-kaiserslautern',
  'hamburger-sv',
  'nantes',
  'la-liga-v2',
  'brest',
  'DFB',
  'toulouse',
  'montpellier',
  'augsburg',
  'england-national-team',
  'luton-town',
  'girona',
  'real-sociedad',
  'burnley',
  'eintracht-frankfurt',
  'norwich-city',
  'valencia',
  'france-national-team',
  'english-premier-league-v2',
  'middlesbrough',
  'fulham',
  'rennes',
  'sheffield-wednesday',
  'real-betis',
  'udinese',
  'monza',
  'empoli',
  'barcelona',
  'fortuna-dusseldorf',
  'sevilla',
  'parma',
  'tottenham',
  'chelsea',
  'cagliari',
  'genoa',
  'derby-county',
  'fc-nurnberg',
  'plymouth-argyle',
  'blackburn-rovers',
  'schalke-04',
  'wolfsburg',
  'arminia-bielefeld',
  'sv-sandhausen',
  'brighton',
  'como-1907',
  'southampton',
  'dfb-german-football-association',
  'rc-lens',
  'inter',
  'millwall',
  'nice',
  'le-havre-ac',
  'nottm-forest',
  'newcastle',
  'arsenal',
  'alemannia-aachen',
  'spain-national-team',
  'marseille',
  'borussia-dortmund',
  'leeds-united',
  'manchester-united',
  'holstein-kiel',
  'cardiff-city',
  'as-saint-etienne',
  'coventry-city',
  'venezia',
  'manchester-city',
  'stoke-city',
  'french-football-federation',
  'angers',
  'fiorentina',
  'sheffield-united',
  'real-madrid',
  'lazio',
  'dynamo-dresden',
  'oxford-united',
  'st-pauli',
  'as-monaco',
  'stade-de-reims',
  'mallorca',
  'wolves',
  'espanyol',
  'aston-villa',
  'hull-city',
  'emirates-fa-cup',
  'osasuna',
  'queens-park-rangers',
  'rayo-vallecano',
  'fc-heidenheim',
  'la-liga',
  'watford',
  'hannover-96',
  'energie-cottbus',
  'leicester',
  'vfb-stuttgart',
  'rc-strasbourg-alsace',
  'leganes',
  'west-bromwich-albion',
  'borussia-monchengladbach',
  'everton',
  'juventus',
  'deportivo',
  'bayer-leverkusen',
  'portsmouth',
  'rb-leipzig',
  'bournemouth',
  'crystal-palace',
  'roma',
  'mainz-05',
  'atletico-madrid',
  'preston-north-end',
  'serie-a',
  'celta',
  'auxerre',
  'hoffenheim',
  'getafe',
  'english-premier-league',
  'atalanta',
  'brentford',
  'las-palmas',
  'ipswich',
  'lille',
];

export const teams: Team[] = teamSlugs.map((slug) => {
  const name = formatTeamName(slug);
  const displayName = name;
  const league = getTeamLeague(slug);
  const category = getTeamCategory(slug);

  return {
    id: slug,
    name,
    displayName,
    slug,
    logoPath: `/src/assets/logos/${slug}.svg`,
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
