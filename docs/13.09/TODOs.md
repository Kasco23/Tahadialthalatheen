Next Improvements for Tahadialthalatheen (September 13th 2025 19:35)
This document captures the next set of improvements based on the latest state of the project. These tasks focus on unresolved issues and new requirements without repeating fixes that have already been implemented (e.g. the duplicate DailyIframe instance issue has been resolved).
🖥️ Browser & Rendering
• [ ] Handle WEBGL_debug_renderer_info deprecation. Firefox logs a warning because the WEBGL_debug_renderer_info extension is deprecated. Ensure your code does not request this extension directly. Update @daily-co/daily-js and @daily-co/daily-react to the latest versions. If the warning persists, document it and confirm whether it originates in a third‑party library.
🪑 Lobby Page Overhaul
• [ ] Recreate the dugout background. The current dugout effect still doesn’t feel like a real bench. Either use a more convincing CSS composition or choose a high‑quality dugout image and set it as a background in Lobby.tsx. Wrap the content in proper dugout-background and dugout-content containers so layers like seating and canopy render correctly.
• [ ] Restructure the lobby layout. Separate the participants list, video call section and action buttons using responsive flex or grid. On large screens, place participants in a sidebar and video call with controls in a main area. On mobile, stack sections vertically and add scroll as needed.
• [ ] Optimize video tile display. Adjust the ParticipantTile component so videos fill their container using object-fit: cover and maintain a 16:9 aspect ratio. Use responsive grid layouts (auto-fit/minmax) to adapt to different screen sizes.
• [ ] Refactor participants rendering. Break out pieces (name, flag, role, presence) into smaller components and map over the players array cleanly. This will make future changes easier and reduce UI clutter.
🎮 Join Page Redesign
• [ ] Implement a multi‑step join wizard. Break the join flow into clear steps: choose role (Game Master or Player), enter session credentials, pick flag and team logo, and confirm. This avoids overlapping forms and selectors on small screens.
• [ ] Fix dropdown layering. Ensure the flag selector’s dropdown overlays above the logo selector by assigning a higher z‑index and absolute positioning. Collapse or hide the logo picker while the flag dropdown is open.
• [ ] Scale team logos properly. Set fixed sizes for logo grid cells and apply object-contain so logos retain their aspect ratio. Provide a fallback to the Chroma render if the image fails to load.
• [ ] Persist host selections. After the host verifies the password, update the existing host participant with the selected flag, logo and host name. Extend joinAsHost to accept these values and call supabase.update() accordingly.
👤 Role Separation: Game Master vs Host
• [ ] Add a GameMaster role to the database. Update your Supabase schema so the role enum includes GameMaster. Adjust TypeScript types to match.
• [ ] Create separate participants on session creation. When a new session is created, insert two participants: one GameMaster record (for the PC user) with lobby_presence: Joined, and one Host record (for the mobile user) with lobby_presence: NotJoined. Use upsert operations to avoid duplicates.
• [ ] Add a joinAsGameMaster() helper. Write a new mutation in src/lib/mutations.ts that returns the GameMaster participant ID and updates their flag/logo. Use this function when the PC user logs in instead of the host join flow.
• [ ] Adjust UI and logic based on role. Use local storage or context to track whether the current user is GameMaster or Host. Display appropriate icons and ensure moderation controls (mute/eject) are only shown to the Host (mobile) user.
• [ ] Review Supabase policies. Ensure that both GameMaster and Host have the correct permissions to read and update session and participant records. Update the verify_host_password RPC if you need to differentiate authentication flows.
📹 Video Call Persistence
• [ ] Keep the Daily call alive across pages. Move creation of the Daily call object to a higher‑level provider (e.g. in App.tsx or a DailyCallWrapper) and avoid destroying it when the lobby unmounts. Hide or show the video grid depending on the current page instead of leaving and rejoining.
🔧 Miscellaneous
• [ ] Clean up stale code. Remove large commented blocks from Join.tsx and Lobby.tsx that reference old tunnel backgrounds. Archive any unused legacy components in an ignored/ folder.
• [ ] Consolidate local storage keys. Refactor to store user information in a single object rather than many separate keys. This simplifies role checks and state management.
• [ ] Expand end‑to‑end tests. Update Playwright tests to validate the multi‑step join flow, video persistence, role separation and improved UI. Use data-testid attributes for targeting elements.
