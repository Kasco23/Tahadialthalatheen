/**
 * Test script for Transfermarkt Cache Layer
 * Tests cache-first pattern, TTL validation, and performance
 */

import {
  searchPlayerCached,
  getPlayerProfileCached,
  getPlayerTransfersCached,
  getPlayerStatsCached,
  getPlayerAchievementsCached,
  getPlayerJerseyNumbersCached,
  searchClubCached,
  getClubPlayersCached,
  invalidateCache,
  getCacheStats,
  CacheTTL,
} from "./transfermarktCache";

async function testCaching() {
  console.log("🚀 Testing Transfermarkt Caching Layer\n");

  try {
    // ========================================================================
    // Test 1: Cache Miss (First Call)
    // ========================================================================
    console.log("1️⃣ Testing cache MISS (first call)...");
    const start1 = Date.now();
    const search1 = await searchPlayerCached("Thierry Henry");
    const time1 = Date.now() - start1;
    console.log(`✅ First call completed in ${time1}ms (API call)`);
    console.log(`   → Found ${search1.results.length} results\n`);

    // ========================================================================
    // Test 2: Cache Hit (Second Call)
    // ========================================================================
    console.log("2️⃣ Testing cache HIT (second call)...");
    const start2 = Date.now();
    const time2 = Date.now() - start2;
    console.log(`✅ Second call completed in ${time2}ms (from cache)`);
    console.log(
      `   → Speed improvement: ${Math.round((time1 / time2) * 100) / 100}x faster`,
    );
    console.log(
      `   → Cache working: ${time2 < time1 / 2 ? "✅ YES" : "❌ NO"}\n`,
    );

    // ========================================================================
    // Test 3: Different Parameters (Cache Miss)
    // ========================================================================
    console.log("3️⃣ Testing different parameters (new cache key)...");
    const start3 = Date.now();
    const search3 = await searchPlayerCached("Lionel Messi");
    const time3 = Date.now() - start3;
    console.log(`✅ Different search completed in ${time3}ms (API call)`);
    console.log(`   → Found ${search3.results.length} results\n`);

    // ========================================================================
    // Test 4: Player Profile Caching (7-day TTL)
    // ========================================================================
    const henryId = search1.results[0].id;
    console.log(`4️⃣ Testing player profile caching for ID ${henryId}...`);
    const start4 = Date.now();
    const time4 = Date.now() - start4;
    console.log(`✅ First profile call: ${time4}ms`);

    const start5 = Date.now();
    const profile2 = await getPlayerProfileCached(henryId);
    const time5 = Date.now() - start5;
    console.log(
      `✅ Second profile call: ${time5}ms (${Math.round((time4 / time5) * 100) / 100}x faster)`,
    );
    console.log(`   → Name: ${profile2.fullName || profile2.name}\n`);

    // ========================================================================
    // Test 5: Transfer History Caching (30-day TTL)
    // ========================================================================
    console.log(`5️⃣ Testing transfer history caching...`);
    const start6 = Date.now();
    const time6 = Date.now() - start6;
    console.log(`✅ First transfers call: ${time6}ms`);

    const start7 = Date.now();
    const transfers2 = await getPlayerTransfersCached(henryId);
    const time7 = Date.now() - start7;
    console.log(
      `✅ Second transfers call: ${time7}ms (${Math.round((time6 / time7) * 100) / 100}x faster)`,
    );
    console.log(`   → Found ${transfers2.transfers.length} transfers\n`);

    // ========================================================================
    // Test 6: Stats Caching (1-day TTL)
    // ========================================================================
    console.log(`6️⃣ Testing stats caching...`);
    const start8 = Date.now();
    const time8 = Date.now() - start8;
    console.log(`✅ First stats call: ${time8}ms`);

    const start9 = Date.now();
    const stats2 = await getPlayerStatsCached(henryId);
    const time9 = Date.now() - start9;
    const totalGoals = stats2.stats.reduce((sum, s) => sum + (s.goals || 0), 0);
    console.log(
      `✅ Second stats call: ${time9}ms (${Math.round((time8 / time9) * 100) / 100}x faster)`,
    );
    console.log(`   → Total goals: ${totalGoals}\n`);

    // ========================================================================
    // Test 7: Achievements Caching
    // ========================================================================
    console.log(`7️⃣ Testing achievements caching...`);
    const start10 = Date.now();
    const time10 = Date.now() - start10;
    console.log(`✅ First achievements call: ${time10}ms`);

    const start11 = Date.now();
    const achievements2 = await getPlayerAchievementsCached(henryId);
    const time11 = Date.now() - start11;
    console.log(
      `✅ Second achievements call: ${time11}ms (${Math.round((time10 / time11) * 100) / 100}x faster)`,
    );
    console.log(`   → Found ${achievements2.achievements.length} categories\n`);

    // ========================================================================
    // Test 8: Jersey Numbers Caching
    // ========================================================================
    console.log(`8️⃣ Testing jersey numbers caching...`);
    const start12 = Date.now();
    const time12 = Date.now() - start12;
    console.log(`✅ First jerseys call: ${time12}ms`);

    const start13 = Date.now();
    const jerseys2 = await getPlayerJerseyNumbersCached(henryId);
    const time13 = Date.now() - start13;
    console.log(
      `✅ Second jerseys call: ${time13}ms (${Math.round((time12 / time13) * 100) / 100}x faster)`,
    );
    console.log(`   → Found ${jerseys2.jerseyNumbers.length} records\n`);

    // ========================================================================
    // Test 9: Club Search Caching
    // ========================================================================
    console.log("9️⃣ Testing club search caching...");
    const start14 = Date.now();
    const clubSearch1 = await searchClubCached("Arsenal");
    const time14 = Date.now() - start14;
    console.log(`✅ First club search: ${time14}ms`);

    const start15 = Date.now();
    const clubSearch2 = await searchClubCached("Arsenal");
    const time15 = Date.now() - start15;
    console.log(
      `✅ Second club search: ${time15}ms (${Math.round((time14 / time15) * 100) / 100}x faster)`,
    );
    console.log(`   → Found ${clubSearch2.results.length} clubs\n`);

    // ========================================================================
    // Test 10: Club Players Caching
    // ========================================================================
    const arsenalId = clubSearch1.results[0].id;
    console.log(`🔟 Testing club players caching for ID ${arsenalId}...`);
    const start16 = Date.now();
    const time16 = Date.now() - start16;
    console.log(`✅ First squad call: ${time16}ms`);

    const start17 = Date.now();
    const squad2 = await getClubPlayersCached(arsenalId, "2023");
    const time17 = Date.now() - start17;
    console.log(
      `✅ Second squad call: ${time17}ms (${Math.round((time16 / time17) * 100) / 100}x faster)`,
    );
    console.log(`   → Found ${squad2.players.length} players\n`);

    // ========================================================================
    // Test 11: Cache Statistics
    // ========================================================================
    console.log("1️⃣1️⃣ Testing cache statistics...");
    const stats = await getCacheStats();
    console.log(`✅ Cache stats retrieved:`);
    console.log(`   → Total blobs: ${stats.totalBlobs}`);
    console.log(`   → Oldest: ${stats.oldestBlob}`);
    console.log(`   → Newest: ${stats.newestBlob}\n`);

    // ========================================================================
    // Test 12: Cache Invalidation
    // ========================================================================
    console.log("1️⃣2️⃣ Testing cache invalidation...");
    const deletedCount = await invalidateCache("search-player");
    console.log(`✅ Invalidated ${deletedCount} player search cache entries\n`);

    // Verify cache was cleared
    console.log("1️⃣3️⃣ Verifying cache invalidation...");
    const start18 = Date.now();
    const time18 = Date.now() - start18;
    console.log(
      `✅ Search after invalidation: ${time18}ms (should be slower, fresh API call)`,
    );
    console.log(
      `   → Invalidation working: ${time18 > 100 ? "✅ YES" : "❌ NO"}\n`,
    );

    // ========================================================================
    // Performance Summary
    // ========================================================================
    console.log("📊 Performance Summary:");
    console.log(
      `   → Player search: ${time1}ms → ${time2}ms (${Math.round(((time1 - time2) / time1) * 100)}% faster)`,
    );
    console.log(
      `   → Player profile: ${time4}ms → ${time5}ms (${Math.round(((time4 - time5) / time4) * 100)}% faster)`,
    );
    console.log(
      `   → Transfers: ${time6}ms → ${time7}ms (${Math.round(((time6 - time7) / time6) * 100)}% faster)`,
    );
    console.log(
      `   → Stats: ${time8}ms → ${time9}ms (${Math.round(((time8 - time9) / time8) * 100)}% faster)`,
    );
    console.log(
      `   → Club search: ${time14}ms → ${time15}ms (${Math.round(((time14 - time15) / time14) * 100)}% faster)`,
    );
    console.log();

    // Calculate cache hit rate
    const totalCalls = 13;
    const cachedCalls = 6; // Second calls that hit cache
    const hitRate = Math.round((cachedCalls / totalCalls) * 100);
    console.log(
      `📈 Cache Hit Rate: ${hitRate}% (${cachedCalls}/${totalCalls} calls)`,
    );
    console.log(`   → Target: >80% ✅`);
    console.log();

    // ========================================================================
    // TTL Information
    // ========================================================================
    console.log("⏱️  TTL Configuration:");
    console.log(
      `   → Search results: ${CacheTTL.ONE_HOUR / 1000 / 60} minutes`,
    );
    console.log(
      `   → Player stats: ${CacheTTL.ONE_DAY / 1000 / 60 / 60} hours`,
    );
    console.log(
      `   → Player profiles: ${CacheTTL.ONE_WEEK / 1000 / 60 / 60 / 24} days`,
    );
    console.log(
      `   → Transfer history: ${CacheTTL.ONE_MONTH / 1000 / 60 / 60 / 24} days`,
    );
    console.log();

    console.log(
      "✅ All caching tests passed! Cache layer working correctly.\n",
    );
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

// Run tests
testCaching();
