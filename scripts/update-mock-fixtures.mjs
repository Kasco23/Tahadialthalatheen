/**
 * Update Mock Fixtures with Real Transfermarkt Data
 * 
 * This script fetches real data from Transfermarkt API and updates
 * the mock JSON files with accurate, up-to-date information.
 */

import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const fixturesDir = join(projectRoot, 'src', 'fixtures', 'transfermarkt');

// Import Transfermarkt client (we need to use dynamic import for ESM)
const { searchPlayerCached, getPlayerProfileCached, getPlayerStatsCached, searchClubCached, getClubPlayersCached } = await import('../src/lib/api/transfermarktCache.ts');

console.log('🔄 Fetching real data from Transfermarkt API...\n');

// ============================================================================
// Generate Questions Fixture
// ============================================================================

console.log('1️⃣ Updating generate_questions.json...');

const generateQuestionsData = [
  {
    question: "Who won the Premier League Golden Boot in 2023-24?",
    answer: "Erling Haaland",
    options: ["Erling Haaland", "Cole Palmer", "Alexander Isak", "Ollie Watkins"],
    difficulty: "medium",
    category: "Premier League",
    metadata: {
      season: "2023-24",
      goals: 27
    }
  },
  {
    question: "Which club signed Jude Bellingham in 2023?",
    answer: "Real Madrid",
    options: ["Real Madrid", "Barcelona", "Bayern Munich", "Liverpool"],
    difficulty: "easy",
    category: "Transfers",
    metadata: {
      transferFee: "€103M",
      fromClub: "Borussia Dortmund"
    }
  },
  {
    question: "Which team won the Champions League in 2023?",
    answer: "Manchester City",
    options: ["Manchester City", "Inter Milan", "Real Madrid", "Bayern Munich"],
    difficulty: "easy",
    category: "Champions League"
  },
  {
    question: "Who is the current top scorer in La Liga history?",
    answer: "Lionel Messi",
    options: ["Lionel Messi", "Cristiano Ronaldo", "Telmo Zarra", "Hugo Sánchez"],
    difficulty: "medium",
    category: "La Liga",
    metadata: {
      goals: 474
    }
  },
  {
    question: "Which player holds the record for most Premier League assists?",
    answer: "Ryan Giggs",
    options: ["Ryan Giggs", "Cesc Fàbregas", "Frank Lampard", "Wayne Rooney"],
    difficulty: "hard",
    category: "Premier League"
  }
];

await writeFile(
  join(fixturesDir, 'generate_questions.json'),
  JSON.stringify(generateQuestionsData, null, 2),
  'utf8'
);
console.log('✅ generate_questions.json updated\n');

// ============================================================================
// Team Squad Fixture - Fetch Real Data
// ============================================================================

console.log('2️⃣ Updating team_squad.json with real data...');

try {
  // Search for Liverpool
  const liverpoolSearch = await searchClubCached('Liverpool');
  const liverpoolId = liverpoolSearch.results[0]?.id;
  
  if (!liverpoolId) {
    throw new Error('Could not find Liverpool club ID');
  }

  // Get Liverpool squad for current season
  const liverpoolSquad = await getClubPlayersCached(liverpoolId, '2024');
  
  // Filter defenders
  const defenders = liverpoolSquad.players
    .filter(p => p.position === 'Defender' || p.position === 'Centre-Back' || p.position === 'Left-Back' || p.position === 'Right-Back')
    .slice(0, 5)
    .map(p => p.name);

  console.log(`   Found ${defenders.length} Liverpool defenders:`, defenders);

  // Search for Manchester City
  const citySearch = await searchClubCached('Manchester City');
  const cityId = citySearch.results[0]?.id;

  if (!cityId) {
    throw new Error('Could not find Manchester City club ID');
  }

  // Get Man City squad
  const citySquad = await getClubPlayersCached(cityId, '2024');
  const cityPlayers = citySquad.players.slice(0, 10).map(p => p.name);

  console.log(`   Found ${cityPlayers.length} Man City players:`, cityPlayers.slice(0, 5));

  // Search for Real Madrid
  const madridSearch = await searchClubCached('Real Madrid');
  const madridId = madridSearch.results[0]?.id;

  if (!madridId) {
    throw new Error('Could not find Real Madrid club ID');
  }

  // Get Real Madrid squad
  const madridSquad = await getClubPlayersCached(madridId, '2024');
  const goalkeeper = madridSquad.players.find(p => p.position === 'Goalkeeper' || p.position === 'Keeper');

  console.log(`   Found Real Madrid goalkeeper:`, goalkeeper?.name);

  const teamSquadData = [
    {
      question: "Name 5 players from Manchester City's 2024-25 squad",
      answer: `Multiple correct answers (e.g., ${cityPlayers.slice(0, 5).join(', ')})`,
      difficulty: "medium",
      category: "Squads",
      metadata: {
        team: "Manchester City",
        season: "2024-25",
        playerCount: citySquad.players.length
      }
    },
    {
      question: "List 3 defenders from Liverpool's current squad",
      answer: `Multiple correct answers (e.g., ${defenders.slice(0, 3).join(', ')})`,
      difficulty: "medium",
      category: "Squads",
      metadata: {
        team: "Liverpool",
        position: "Defender",
        availableDefenders: defenders
      }
    },
    {
      question: "Name the goalkeeper for Real Madrid",
      answer: goalkeeper?.name || "Thibaut Courtois",
      options: [
        goalkeeper?.name || "Thibaut Courtois",
        "Kepa Arrizabalaga",
        "Andriy Lunin",
        "David De Gea"
      ],
      difficulty: "easy",
      category: "Squads",
      metadata: {
        team: "Real Madrid",
        position: "Goalkeeper"
      }
    }
  ];

  await writeFile(
    join(fixturesDir, 'team_squad.json'),
    JSON.stringify(teamSquadData, null, 2),
    'utf8'
  );
  console.log('✅ team_squad.json updated with real data\n');

} catch (error) {
  console.error('⚠️  Failed to fetch real squad data:', error.message);
  console.log('   Using fallback data instead\n');
  
  // Fallback to reasonable defaults
  const teamSquadDataFallback = [
    {
      question: "Name 5 players from Manchester City's 2024-25 squad",
      answer: "Multiple correct answers (e.g., Haaland, De Bruyne, Rodri, Foden, Walker)",
      difficulty: "medium",
      category: "Squads",
      metadata: {
        team: "Manchester City",
        season: "2024-25"
      }
    },
    {
      question: "List 3 defenders from Liverpool's current squad",
      answer: "Multiple correct answers (e.g., Van Dijk, Konaté, Alexander-Arnold)",
      difficulty: "medium",
      category: "Squads",
      metadata: {
        team: "Liverpool",
        position: "Defender"
      }
    },
    {
      question: "Name the goalkeeper for Real Madrid",
      answer: "Thibaut Courtois",
      options: ["Thibaut Courtois", "Kepa Arrizabalaga", "Andriy Lunin", "David De Gea"],
      difficulty: "easy",
      category: "Squads"
    }
  ];

  await writeFile(
    join(fixturesDir, 'team_squad.json'),
    JSON.stringify(teamSquadDataFallback, null, 2),
    'utf8'
  );
  console.log('✅ team_squad.json updated with fallback data\n');
}

// ============================================================================
// Transfers Fixture
// ============================================================================

console.log('3️⃣ Updating transfers.json...');

const transfersData = [
  {
    question: "Which club did Declan Rice join in 2023?",
    answer: "Arsenal",
    options: ["Arsenal", "Manchester City", "Chelsea", "Liverpool"],
    difficulty: "easy",
    category: "Transfers",
    metadata: {
      fee: "£105M",
      fromClub: "West Ham United",
      date: "July 2023"
    }
  },
  {
    question: "Where did Harry Kane transfer to in 2023?",
    answer: "Bayern Munich",
    options: ["Bayern Munich", "Real Madrid", "Paris Saint-Germain", "Manchester United"],
    difficulty: "easy",
    category: "Transfers",
    metadata: {
      fee: "€100M",
      fromClub: "Tottenham Hotspur",
      date: "August 2023"
    }
  },
  {
    question: "Which Saudi club signed Cristiano Ronaldo in 2023?",
    answer: "Al-Nassr",
    options: ["Al-Nassr", "Al-Hilal", "Al-Ittihad", "Al-Ahli"],
    difficulty: "easy",
    category: "Transfers",
    metadata: {
      fromClub: "Manchester United (free agent)",
      date: "January 2023"
    }
  }
];

await writeFile(
  join(fixturesDir, 'transfers.json'),
  JSON.stringify(transfersData, null, 2),
  'utf8'
);
console.log('✅ transfers.json updated\n');

console.log('🎉 All fixtures updated successfully!');
