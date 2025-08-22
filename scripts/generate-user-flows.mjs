#!/usr/bin/env node

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// Ensure flows directory exists
const flowsDir = join(projectRoot, 'docs', 'flows');
if (!existsSync(flowsDir)) {
  mkdirSync(flowsDir, { recursive: true });
}

/**
 * Generate Draw.io XML format state diagrams for user flows
 *
 * User Roles:
 * 1. Controller - Creates sessions, manages control room
 * 2. Host - Joins sessions, manages video, controls quiz
 * 3. Player - Joins sessions, participates in quiz
 */

// Color scheme for different components
const colors = {
  frontend: '#4F46E5', // Indigo
  backend: '#DC2626', // Red
  shared: '#059669', // Green
  transition: '#7C3AED', // Purple
};

// Generate Controller Frontend Flow
function generateControllerFrontendFlow() {
  return `
<mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169">
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    
    <!-- Start State -->
    <mxCell id="start" value="Landing Page" style="ellipse;whiteSpace=wrap;html=1;fillColor=${colors.frontend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="360" y="40" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Create Session -->
    <mxCell id="create" value="Create Session\\n(Enter host name)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${colors.frontend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="360" y="140" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Session Config -->
    <mxCell id="config" value="Session Config\\n(Auto-generate ID)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${colors.frontend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="360" y="240" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Control Room -->
    <mxCell id="control" value="Control Room\\n(Host PC Interface)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${colors.frontend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="360" y="340" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Lobby Management -->
    <mxCell id="lobby_mgmt" value="Lobby Management\\n(Monitor players)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${colors.frontend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="360" y="440" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Quiz Control -->
    <mxCell id="quiz_control" value="Quiz Control\\n(Manage segments)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${colors.frontend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="200" y="540" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Video Management -->
    <mxCell id="video_mgmt" value="Video Management\\n(Create/manage rooms)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${colors.frontend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="520" y="540" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- End State -->
    <mxCell id="end" value="Session Complete" style="ellipse;whiteSpace=wrap;html=1;fillColor=${colors.shared};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="360" y="640" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Transitions -->
    <mxCell edge="1" parent="1" source="start" target="create">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="create" target="config">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="config" target="control">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="control" target="lobby_mgmt">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="lobby_mgmt" target="quiz_control">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="lobby_mgmt" target="video_mgmt">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="quiz_control" target="end">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="video_mgmt" target="end">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    
  </root>
</mxGraphModel>`;
}

// Generate Controller Backend Flow
function generateControllerBackendFlow() {
  return `
<mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169">
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    
    <!-- Start State -->
    <mxCell id="start" value="System Ready" style="ellipse;whiteSpace=wrap;html=1;fillColor=${colors.backend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="360" y="40" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Create Game Record -->
    <mxCell id="create_record" value="Create Game Record\\n(Supabase INSERT)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${colors.backend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="360" y="140" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Initialize State -->
    <mxCell id="init_state" value="Initialize State\\n(phase: CONFIG)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${colors.backend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="360" y="240" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Setup Realtime -->
    <mxCell id="setup_realtime" value="Setup Realtime\\n(Supabase channels)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${colors.backend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="360" y="340" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Monitor Connections -->
    <mxCell id="monitor" value="Monitor Connections\\n(Track participants)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${colors.backend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="360" y="440" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Game State Management -->
    <mxCell id="game_state" value="Game State Mgmt\\n(phase: PLAYING)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${colors.backend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="200" y="540" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Video Room API -->
    <mxCell id="video_api" value="Video Room API\\n(Daily.co integration)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${colors.backend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="520" y="540" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- End State -->
    <mxCell id="end" value="Cleanup State\\n(phase: COMPLETED)" style="ellipse;whiteSpace=wrap;html=1;fillColor=${colors.backend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="360" y="640" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Transitions -->
    <mxCell edge="1" parent="1" source="start" target="create_record">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="create_record" target="init_state">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="init_state" target="setup_realtime">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="setup_realtime" target="monitor">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="monitor" target="game_state">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="monitor" target="video_api">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="game_state" target="end">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="video_api" target="end">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    
  </root>
</mxGraphModel>`;
}

// Generate Host Frontend Flow
function generateHostFrontendFlow() {
  return `
<mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169">
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    
    <!-- Start State -->
    <mxCell id="start" value="Landing Page" style="ellipse;whiteSpace=wrap;html=1;fillColor=${colors.frontend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="360" y="40" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Join Game -->
    <mxCell id="join" value="Join Game\\n(Enter game ID)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${colors.frontend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="360" y="140" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Lobby Entry -->
    <mxCell id="lobby_entry" value="Lobby Entry\\n(As Host)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${colors.frontend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="360" y="240" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Video Room Setup -->
    <mxCell id="video_setup" value="Video Room Setup\\n(Create/join room)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${colors.frontend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="360" y="340" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Quiz Hosting -->
    <mxCell id="quiz_host" value="Quiz Hosting\\n(Control segments)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${colors.frontend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="200" y="440" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Segment Control -->
    <mxCell id="segment_ctrl" value="Segment Control\\n(BELL/SING/REMO)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${colors.frontend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="520" y="440" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Score Management -->
    <mxCell id="score_mgmt" value="Score Management\\n(Update points)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${colors.frontend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="200" y="540" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Timer Control -->
    <mxCell id="timer_ctrl" value="Timer Control\\n(Start/stop/reset)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${colors.frontend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="520" y="540" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- End State -->
    <mxCell id="end" value="Final Scores\\n& Cleanup" style="ellipse;whiteSpace=wrap;html=1;fillColor=${colors.shared};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="360" y="640" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Transitions -->
    <mxCell edge="1" parent="1" source="start" target="join">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="join" target="lobby_entry">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="lobby_entry" target="video_setup">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="video_setup" target="quiz_host">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="video_setup" target="segment_ctrl">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="quiz_host" target="score_mgmt">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="segment_ctrl" target="timer_ctrl">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="score_mgmt" target="end">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="timer_ctrl" target="end">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    
  </root>
</mxGraphModel>`;
}

// Generate Host Backend Flow
function generateHostBackendFlow() {
  return `
<mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169">
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    
    <!-- Start State -->
    <mxCell id="start" value="Game Exists" style="ellipse;whiteSpace=wrap;html=1;fillColor=${colors.backend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="360" y="40" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Load Game State -->
    <mxCell id="load_state" value="Load Game State\\n(Supabase SELECT)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${colors.backend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="360" y="140" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Subscribe to Updates -->
    <mxCell id="subscribe" value="Subscribe Updates\\n(Realtime channel)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${colors.backend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="360" y="240" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Video Room Creation -->
    <mxCell id="video_create" value="Video Room API\\n(Daily.co create)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${colors.backend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="360" y="340" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Game State Updates -->
    <mxCell id="state_updates" value="Game State Updates\\n(phase: PLAYING)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${colors.backend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="200" y="440" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Segment Progression -->
    <mxCell id="segment_prog" value="Segment Progression\\n(current_segment)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${colors.backend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="520" y="440" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Score Updates -->
    <mxCell id="score_updates" value="Score Updates\\n(Player records)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${colors.backend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="200" y="540" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Timer Sync -->
    <mxCell id="timer_sync" value="Timer Sync\\n(timer, is_timer_running)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${colors.backend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="520" y="540" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- End State -->
    <mxCell id="end" value="Game Complete\\n(phase: COMPLETED)" style="ellipse;whiteSpace=wrap;html=1;fillColor=${colors.backend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="360" y="640" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Transitions -->
    <mxCell edge="1" parent="1" source="start" target="load_state">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="load_state" target="subscribe">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="subscribe" target="video_create">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="video_create" target="state_updates">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="video_create" target="segment_prog">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="state_updates" target="score_updates">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="segment_prog" target="timer_sync">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="score_updates" target="end">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="timer_sync" target="end">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    
  </root>
</mxGraphModel>`;
}

// Generate Player Frontend Flow
function generatePlayerFrontendFlow() {
  return `
<mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169">
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    
    <!-- Start State -->
    <mxCell id="start" value="Landing Page" style="ellipse;whiteSpace=wrap;html=1;fillColor=${colors.frontend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="360" y="40" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Join Game -->
    <mxCell id="join" value="Join Game\\n(Enter game ID)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${colors.frontend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="360" y="140" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Player Setup -->
    <mxCell id="player_setup" value="Player Setup\\n(Name, flag, club)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${colors.frontend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="360" y="240" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Lobby Wait -->
    <mxCell id="lobby_wait" value="Lobby Wait\\n(See other players)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${colors.frontend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="360" y="340" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Quiz Participation -->
    <mxCell id="quiz_part" value="Quiz Participation\\n(Answer questions)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${colors.frontend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="360" y="440" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Bell Interaction -->
    <mxCell id="bell_interact" value="Bell Interaction\\n(Press buzzer)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${colors.frontend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="200" y="540" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Score Display -->
    <mxCell id="score_display" value="Score Display\\n(View points/ranking)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${colors.frontend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="520" y="540" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Video Participation -->
    <mxCell id="video_part" value="Video Participation\\n(See/speak in room)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${colors.frontend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="360" y="640" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- End State -->
    <mxCell id="end" value="Final Results\\n& Exit" style="ellipse;whiteSpace=wrap;html=1;fillColor=${colors.shared};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="360" y="740" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Transitions -->
    <mxCell edge="1" parent="1" source="start" target="join">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="join" target="player_setup">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="player_setup" target="lobby_wait">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="lobby_wait" target="quiz_part">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="quiz_part" target="bell_interact">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="quiz_part" target="score_display">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="quiz_part" target="video_part">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="bell_interact" target="end">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="score_display" target="end">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="video_part" target="end">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    
  </root>
</mxGraphModel>`;
}

// Generate Player Backend Flow
function generatePlayerBackendFlow() {
  return `
<mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169">
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    
    <!-- Start State -->
    <mxCell id="start" value="Game Available" style="ellipse;whiteSpace=wrap;html=1;fillColor=${colors.backend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="360" y="40" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Validate Game ID -->
    <mxCell id="validate" value="Validate Game ID\\n(Supabase lookup)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${colors.backend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="360" y="140" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Register Player -->
    <mxCell id="register" value="Register Player\\n(Update players table)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${colors.backend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="360" y="240" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Subscribe to Game -->
    <mxCell id="subscribe_game" value="Subscribe to Game\\n(Realtime channel)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${colors.backend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="360" y="340" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Sync Game State -->
    <mxCell id="sync_state" value="Sync Game State\\n(Receive updates)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${colors.backend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="360" y="440" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Submit Answers -->
    <mxCell id="submit_answers" value="Submit Answers\\n(Send responses)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${colors.backend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="200" y="540" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Receive Score Updates -->
    <mxCell id="receive_scores" value="Receive Scores\\n(Live score sync)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${colors.backend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="520" y="540" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Heartbeat Maintenance -->
    <mxCell id="heartbeat" value="Heartbeat\\n(Connection alive)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${colors.backend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="360" y="640" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- End State -->
    <mxCell id="end" value="Player Disconnected\\n(Cleanup)" style="ellipse;whiteSpace=wrap;html=1;fillColor=${colors.backend};fontColor=white;strokeColor=white;" vertex="1" parent="1">
      <mxGeometry x="360" y="740" width="120" height="60" as="geometry"/>
    </mxCell>
    
    <!-- Transitions -->
    <mxCell edge="1" parent="1" source="start" target="validate">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="validate" target="register">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="register" target="subscribe_game">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="subscribe_game" target="sync_state">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="sync_state" target="submit_answers">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="sync_state" target="receive_scores">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="sync_state" target="heartbeat">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="submit_answers" target="end">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="receive_scores" target="end">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" parent="1" source="heartbeat" target="end">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    
  </root>
</mxGraphModel>`;
}

// Wrap diagrams in Draw.io format
function wrapInDrawioFormat(content, title) {
  return `<mxfile host="app.diagrams.net" modified="${new Date().toISOString()}" agent="5.0" version="24.7.17" etag="generated">
  <diagram name="${title}" id="${title.toLowerCase().replace(/\s+/g, '-')}">
    ${content}
  </diagram>
</mxfile>`;
}

// Generate all diagrams
console.log('🎯 Generating User Flow State Diagrams...');

const diagrams = [
  {
    name: 'controller-frontend-flow.drawio',
    content: wrapInDrawioFormat(
      generateControllerFrontendFlow(),
      'Controller Frontend Flow',
    ),
    title: 'Controller Frontend User Flow',
  },
  {
    name: 'controller-backend-flow.drawio',
    content: wrapInDrawioFormat(
      generateControllerBackendFlow(),
      'Controller Backend Flow',
    ),
    title: 'Controller Backend State Flow',
  },
  {
    name: 'host-frontend-flow.drawio',
    content: wrapInDrawioFormat(
      generateHostFrontendFlow(),
      'Host Frontend Flow',
    ),
    title: 'Host Frontend User Flow',
  },
  {
    name: 'host-backend-flow.drawio',
    content: wrapInDrawioFormat(generateHostBackendFlow(), 'Host Backend Flow'),
    title: 'Host Backend State Flow',
  },
  {
    name: 'player-frontend-flow.drawio',
    content: wrapInDrawioFormat(
      generatePlayerFrontendFlow(),
      'Player Frontend Flow',
    ),
    title: 'Player Frontend User Flow',
  },
  {
    name: 'player-backend-flow.drawio',
    content: wrapInDrawioFormat(
      generatePlayerBackendFlow(),
      'Player Backend Flow',
    ),
    title: 'Player Backend State Flow',
  },
];

// Write all diagram files
diagrams.forEach((diagram) => {
  const filePath = join(flowsDir, diagram.name);
  writeFileSync(filePath, diagram.content);
  console.log(`✅ Generated: ${diagram.title} -> ${diagram.name}`);
});

// Generate README for the flows directory
const readmeContent = `# User Flow State Diagrams

This directory contains comprehensive state diagrams for the Thirty Challenge Quiz application, showing both frontend user interactions and backend state management for each user role.

## Diagrams Overview

### Controller Flow
- **controller-frontend-flow.drawio**: Frontend interactions for session creation and control room management
- **controller-backend-flow.drawio**: Backend state management for session creation and realtime setup

### Host Flow  
- **host-frontend-flow.drawio**: Frontend interactions for quiz hosting and segment control
- **host-backend-flow.drawio**: Backend state management for game state updates and video room API

### Player Flow
- **player-frontend-flow.drawio**: Frontend interactions for game participation and buzzer usage
- **player-backend-flow.drawio**: Backend state management for player registration and score sync

## User Roles

### Controller
- Creates new game sessions from landing page
- Manages control room interface (PC-based)
- Monitors participant connections
- Controls session lifecycle

### Host
- Joins existing game sessions
- Manages video room creation and setup
- Controls quiz flow and segment progression
- Updates scores and manages timers

### Player
- Joins games via game ID
- Participates in quiz segments
- Uses buzzer for bell segments
- Views real-time scores and rankings

## Technical Implementation

**Frontend**: React 19 + Vite 7 + Tailwind CSS
**Backend**: Supabase realtime + Daily.co video API  
**State Management**: Jotai atoms with game sync
**Deployment**: Netlify static hosting

## Color Coding

- 🔵 **Frontend States** (Indigo): User interface interactions
- 🔴 **Backend States** (Red): Server-side state management  
- 🟢 **Shared States** (Green): Common completion states
- 🟣 **Transitions** (Purple): State change triggers

Generated on: ${new Date().toISOString()}
`;

writeFileSync(join(flowsDir, 'README.md'), readmeContent);
console.log('📚 Generated: Flow diagrams README');

console.log(
  `\n🎉 Successfully generated ${diagrams.length} user flow diagrams!`,
);
console.log('📁 Location: docs/flows/');
console.log(
  '🔧 Open .drawio files in draw.io or VS Code with Draw.io Integration extension',
);
