/**
 * Test script for Transfermarkt API wrapper
 * Tests all core methods with real API calls
 */

import { transfermarktClient, TransfermarktAPIError } from "./transfermarkt";

async function testAPI() {
  console.log("🚀 Testing Transfermarkt API Wrapper\n");

  try {
    // Test 1: Search for a player
    console.log('1️⃣ Testing searchPlayer("Thierry Henry")...');
    const searchResults =
      await transfermarktClient.searchPlayer("Thierry Henry");
    console.log(`✅ Found ${searchResults.results.length} results`);
    const henry = searchResults.results[0];
    console.log(
      `   → ${henry.name} (ID: ${henry.id}), Club: ${henry.club.name}\n`,
    );

    // Test 2: Get player profile
    console.log(`2️⃣ Testing getPlayerProfile("${henry.id}")...`);
    const profile = await transfermarktClient.getPlayerProfile(henry.id);
    console.log(`✅ Profile loaded: ${profile.fullName || profile.name}`);
    console.log(
      `   → Born: ${profile.dateOfBirth}, Nationality: ${profile.citizenship.join(", ")}`,
    );
    console.log(
      `   → Position: ${profile.position.main}, Height: ${profile.height}cm\n`,
    );

    // Test 3: Get player transfers
    console.log(`3️⃣ Testing getPlayerTransfers("${henry.id}")...`);
    const transfers = await transfermarktClient.getPlayerTransfers(henry.id);
    console.log(`✅ Found ${transfers.transfers.length} transfers`);
    const clubs = transfers.transfers.map((t) => t.clubTo.name).slice(0, 5);
    console.log(`   → First 5 clubs: ${clubs.join(" → ")}\n`);

    // Test 4: Get player stats
    console.log(`4️⃣ Testing getPlayerStats("${henry.id}")...`);
    const stats = await transfermarktClient.getPlayerStats(henry.id);
    console.log(`✅ Found stats for ${stats.stats.length} competitions`);
    const totalGoals = stats.stats.reduce((sum, s) => sum + (s.goals || 0), 0);
    const totalAssists = stats.stats.reduce(
      (sum, s) => sum + (s.assists || 0),
      0,
    );
    console.log(
      `   → Total goals: ${totalGoals}, Total assists: ${totalAssists}\n`,
    );

    // Test 5: Get player achievements
    console.log(`5️⃣ Testing getPlayerAchievements("${henry.id}")...`);
    const achievements = await transfermarktClient.getPlayerAchievements(
      henry.id,
    );
    console.log(
      `✅ Found ${achievements.achievements.length} achievement categories`,
    );
    achievements.achievements.slice(0, 3).forEach((a) => {
      console.log(`   → ${a.title} (${a.count}x)`);
    });
    console.log();

    // Test 6: Get jersey numbers
    console.log(`6️⃣ Testing getPlayerJerseyNumbers("${henry.id}")...`);
    const jerseys = await transfermarktClient.getPlayerJerseyNumbers(henry.id);
    console.log(
      `✅ Found ${jerseys.jerseyNumbers.length} jersey number records`,
    );
    jerseys.jerseyNumbers.slice(0, 5).forEach((j) => {
      console.log(`   → #${j.jerseyNumber} at ${j.club} (${j.season})`);
    });
    console.log();

    // Test 7: Search for a club
    console.log('7️⃣ Testing searchClub("Arsenal")...');
    const clubSearch = await transfermarktClient.searchClub("Arsenal");
    console.log(`✅ Found ${clubSearch.results.length} clubs`);
    const arsenal = clubSearch.results[0];
    console.log(
      `   → ${arsenal.name} (ID: ${arsenal.id}), Squad size: ${arsenal.squad}\n`,
    );

    // Test 8: Get club players
    console.log(`8️⃣ Testing getClubPlayers("${arsenal.id}", "2023")...`);
    const squad = await transfermarktClient.getClubPlayers(arsenal.id, "2023");
    console.log(`✅ Found ${squad.players.length} players in 2023 squad`);
    const topPlayers = squad.players.slice(0, 5);
    topPlayers.forEach((p) => {
      console.log(`   → ${p.name} (${p.position})`);
    });
    console.log();

    // Test 9: Search for competition
    console.log('9️⃣ Testing searchCompetition("Premier League")...');
    const compSearch =
      await transfermarktClient.searchCompetition("Premier League");
    console.log(`✅ Found ${compSearch.results.length} competitions`);
    const premierLeague = compSearch.results[0];
    console.log(
      `   → ${premierLeague.name} (ID: ${premierLeague.id}), ${premierLeague.clubs} clubs\n`,
    );

    // Test 10: Get competition clubs
    console.log(
      `🔟 Testing getCompetitionClubs("${premierLeague.id}", "2023")...`,
    );
    const compClubs = await transfermarktClient.getCompetitionClubs(
      premierLeague.id,
      "2023",
    );
    console.log(
      `✅ Found ${compClubs.clubs.length} clubs in ${compClubs.name} ${compClubs.seasonId}`,
    );
    const topClubs = compClubs.clubs.slice(0, 5);
    console.log(`   → First 5: ${topClubs.map((c) => c.name).join(", ")}\n`);

    console.log("✅ All tests passed! API wrapper working correctly.\n");
  } catch (error) {
    if (error instanceof TransfermarktAPIError) {
      console.error(`❌ API Error: ${error.message}`);
      console.error(
        `   Status: ${error.statusCode}, Endpoint: ${error.endpoint}`,
      );
    } else {
      console.error("❌ Unexpected error:", error);
    }
    process.exit(1);
  }
}

// Run tests
testAPI();
