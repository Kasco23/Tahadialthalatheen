#!/usr/bin/env node

// Script to fix the video room state synchronization issue
// This script directly updates the Supabase database to set the video_room_url

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixVideoRoomState() {
  const gameId = 'YSJWZC';
  const videoRoomUrl = 'https://thirty.daily.co/YSJWZC';

  console.log('🔧 Fixing video room state synchronization...');
  console.log('Game ID:', gameId);
  console.log('Video Room URL:', videoRoomUrl);

  try {
    // First, check current state
    const { data: currentGame, error: fetchError } = await supabase
      .from('games')
      .select('id, video_room_created, video_room_url')
      .eq('id', gameId)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching current game state:', fetchError);
      return;
    }

    console.log('📊 Current state:');
    console.log('  video_room_created:', currentGame.video_room_created);
    console.log('  video_room_url:', currentGame.video_room_url);

    // Update the game with proper video room state
    const { data: updatedGame, error: updateError } = await supabase
      .from('games')
      .update({
        video_room_created: true,
        video_room_url: videoRoomUrl,
      })
      .eq('id', gameId)
      .select('id, video_room_created, video_room_url')
      .single();

    if (updateError) {
      console.error('❌ Error updating game state:', updateError);
      return;
    }

    console.log('✅ Successfully updated game state:');
    console.log('  video_room_created:', updatedGame.video_room_created);
    console.log('  video_room_url:', updatedGame.video_room_url);

    console.log('🎉 Video room state synchronization fixed!');
    console.log('💡 The UI should now show the video room as created.');
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the fix
fixVideoRoomState()
  .then(() => {
    console.log('🏁 Script completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
