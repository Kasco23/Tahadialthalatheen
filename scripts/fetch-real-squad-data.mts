/**
 * Fetch real squad data from Transfermarkt API
 */

import { transfermarktClient } from '../src/lib/api/transfermarkt';

async function fetchSquadData() {
  try {
    console.log('🔍 Searching for Liverpool...');
    const liverpoolSearch = await transfermarktClient.searchClub('Liverpool');
    const liverpoolId = liverpoolSearch.results[0]?.id;
    console.log('✅ Liverpool ID:', liverpoolId);
    
    if (liverpoolId) {
      console.log('\n📋 Getting Liverpool squad for 2024...');
      const squad = await transfermarktClient.getClubPlayers(liverpoolId, '2024');
      console.log('\n🛡️  DEFENDERS:');
      squad.players
        .filter(p => 
          p.position.toLowerCase().includes('back') || 
          p.position.toLowerCase().includes('defender')
        )
        .forEach(p => console.log(`  - ${p.name} (${p.position})`));
    }
    
    console.log('\n\n🔍 Searching for Manchester City...');
    const citySearch = await transfermarktClient.searchClub('Manchester City');
    const cityId = citySearch.results[0]?.id;
    console.log('✅ Manchester City ID:', cityId);
    
    if (cityId) {
      console.log('\n📋 Getting Man City squad for 2024...');
      const squad = await transfermarktClient.getClubPlayers(cityId, '2024');
      console.log('\n⚽ ALL PLAYERS (first 10):');
      squad.players.slice(0, 10).forEach(p => 
        console.log(`  - ${p.name} (${p.position})`)
      );
    }
    
    console.log('\n\n🔍 Searching for Real Madrid...');
    const madridSearch = await transfermarktClient.searchClub('Real Madrid');
    const madridId = madridSearch.results[0]?.id;
    console.log('✅ Real Madrid ID:', madridId);
    
    if (madridId) {
      console.log('\n📋 Getting Real Madrid squad for 2024...');
      const squad = await transfermarktClient.getClubPlayers(madridId, '2024');
      console.log('\n🧤 GOALKEEPERS:');
      squad.players
        .filter(p => p.position.toLowerCase().includes('goalkeeper') || p.position.toLowerCase().includes('keeper'))
        .forEach(p => console.log(`  - ${p.name} (${p.position})`));
        
      console.log('\n🛡️  DEFENDERS:');
      squad.players
        .filter(p => 
          p.position.toLowerCase().includes('back') || 
          p.position.toLowerCase().includes('defender')
        )
        .slice(0, 5)
        .forEach(p => console.log(`  - ${p.name} (${p.position})`));
    }
    
    console.log('\n\n🔍 Searching for Arsenal...');
    const arsenalSearch = await transfermarktClient.searchClub('Arsenal');
    const arsenalId = arsenalSearch.results[0]?.id;
    console.log('✅ Arsenal ID:', arsenalId);
    
    if (arsenalId) {
      console.log('\n📋 Getting Arsenal squad for 2024...');
      const squad = await transfermarktClient.getClubPlayers(arsenalId, '2024');
      console.log('\n⚡ FORWARDS:');
      squad.players
        .filter(p => 
          p.position.toLowerCase().includes('forward') || 
          p.position.toLowerCase().includes('winger') ||
          p.position.toLowerCase().includes('striker')
        )
        .forEach(p => console.log(`  - ${p.name} (${p.position})`));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fetchSquadData();
