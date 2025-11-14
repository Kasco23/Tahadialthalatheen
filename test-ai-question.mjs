#!/usr/bin/env node

/**
 * Test AI Question Generation
 * 
 * Tests the generate-ai-question endpoint with a real WDYK question
 */

const testPrompt = `Name players who lost a European Cup Final last season (clubs only).

Constraints:
- Include ALL players who either started OR were on the bench in the final
- European Cup Finals are: UEFA Champions League, UEFA Europa League, UEFA Conference League
- Last season = 2024/2025

Return format: Table with columns: Player Name, Team (that lost), Against (winner), Competition, Started (yes/no), Benched (yes/no), Subbed In (yes/no), Subbed Out (yes/no)`;

async function testAIGeneration() {
  console.log("🧪 Testing AI Question Generation");
  console.log("=" .repeat(60));
  console.log("\n📝 Prompt:");
  console.log(testPrompt);
  console.log("\n" + "=".repeat(60));
  
  const startTime = Date.now();
  
  try {
    const response = await fetch("http://localhost:3000/api/generate-ai-question", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: testPrompt,
        generatedBy: "test-user-id",
        segment: "WDYK",
      }),
    });

    const responseTime = Date.now() - startTime;
    
    console.log(`\n⏱️  Response Time: ${responseTime}ms`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error("\n❌ Error Response:");
      console.error(JSON.stringify(data, null, 2));
      return;
    }
    
    console.log("\n✅ Success!");
    console.log("\n📋 Question:", data.question);
    console.log(`\n👥 Total Players: ${data.answers.length}`);
    
    if (data.playerDetails && data.playerDetails.length > 0) {
      console.log("\n🏆 Player Details:");
      console.log("─".repeat(120));
      console.log(
        "Player Name".padEnd(30) + 
        "Team".padEnd(20) + 
        "Against".padEnd(20) + 
        "Comp".padEnd(8) + 
        "Started".padEnd(10) + 
        "Bench".padEnd(10) + 
        "Sub In".padEnd(10) + 
        "Sub Out"
      );
      console.log("─".repeat(120));
      
      data.playerDetails.forEach((player) => {
        console.log(
          player.name.padEnd(30) +
          player.team.padEnd(20) +
          player.against.padEnd(20) +
          player.competition.padEnd(8) +
          (player.started ? "✓" : "✗").padEnd(10) +
          (player.benched ? "✓" : "✗").padEnd(10) +
          (player.subbed_in ? "✓" : "✗").padEnd(10) +
          (player.subbed_out ? "✓" : "✗")
        );
      });
      console.log("─".repeat(120));
    }
    
    console.log("\n📊 Metadata:");
    console.log("  - AI Model:", data.metadata.ai_model);
    console.log("  - Provider:", data.metadata.provider);
    console.log("  - Generation Method:", data.metadata.generation_method);
    console.log("  - Total Answers:", data.metadata.total_answers);
    console.log("  - Generation Time:", data.metadata.generation_time_ms + "ms");
    
    if (data.metadata.finals_included) {
      console.log("\n🏆 Finals Included:");
      data.metadata.finals_included.forEach((final) => {
        console.log(`  - ${final}`);
      });
    }
    
    console.log("\n💾 Saved to Database:");
    console.log("  Question ID:", data.questionId);
    
    console.log("\n" + "=".repeat(60));
    console.log("✅ TEST COMPLETED SUCCESSFULLY");
    console.log("=".repeat(60));
    
  } catch (error) {
    console.error("\n❌ Test Failed:");
    console.error(error.message);
    console.error("\nFull Error:");
    console.error(error);
  }
}

// Run the test
testAIGeneration();
