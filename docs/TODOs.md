Pending Improvements and Fixes for Tahadialthalatheen

This document collects concrete tasks to address the outstanding issues in the Tahadialthalatheen project. Each task includes sufficient context and guidance so that GitHub Copilot (via context7, sequentialthinking, supabase and other mcps) can propose meaningful code changes without guessing.

✨ **Visual polish**
**Join page tunnel background**

- [ ] The current tunnel effect on the Join page is built with Tailwind gradients and pseudo‑elements but doesn't evoke a football player tunnel. See the placeholder comments in src/pages/Join.tsx and the custom backgrounds defined in tailwind.config.js (tunnel-gradient and champions-tunnel). Swap this out for a realistic tunnel:
  - [ ] Source a high‑quality stadium tunnel photo (copyright‑free) and add it to the public folder; or, alternatively, design a new CSS composition using perspective lines, dark walls and light at the end to mimic a tunnel. Remove the commented placeholders.

  - [ ] Apply the image via a bg-[url('/path/to/tunnel.jpg')] class or define a new Tailwind background (e.g. player-tunnel) in tailwind.config.js.

  - [ ] Ensure the overlay layer still darkens the background so text remains legible.

**Lobby dugout background**

- [ ] The lobby currently uses a “dugout” effect defined in src/index.css with a linear gradient and repeating stripe pattern for seats. Users report it looks more like a gradient than a bench. Replace this with a more convincing dugout/bench illustration: Users report it looks more like a gradient than a bench. Replace this with a more convincing dugout/bench illustration:
  - [ ] Introduce a realistic bench texture or image (again placed in public) and use background-image with background-size: cover so seats look like actual benches.

  - [ ] Retain the lighting and canopy pseudo‑elements if desired, but adjust colours so they better match real dugouts (metal or leather seats, darker tones).

  - [ ] Test responsiveness on mobile: the bench area should compress gracefully without cutting off players.

🏁 **Team and league logos**
**Display league logos in logo selectors**

- [ ] Supabase function list-logos returns a leagueLogo property for each category folder, but the React component LogoSelector.tsx maps the response into an array of leagues without keeping the league’s logo. Update the mapping logic:
  - [ ] Include leagueLogo as a field in the League type and assign it when building leaguesArray.

  - [ ] In the UI, render the league logo to the left of the league’s displayName in the collapsible header of each league. Use an <img> with fixed width/height and alt text, wrapped in a flex container for alignment.

  - [ ] Rename any references to “categories” in the UI to “Leagues” so the terminology matches the data returned by Supabase. Check the search field placeholder and headings.

**Improve team logo picker ergonomics**

- [ ] On small screens the FlagSelector and LogoSelector overlap; the flag search input disappears behind the logo picker. Fix the layout so selecting a flag doesn’t hide the search bar:
  - [ ] In Join.tsx, wrap the flag and logo selectors in a responsive flex container. On desktop, show them side by side; on mobile (<768 px) stack them vertically using flex-col and add space-y-4.

  - [ ] When a user clicks into the flag selector, expand it into a modal or dropdown that overlays above the logo selector instead of pushing behind it. You can achieve this by setting position: relative on the parent and z-index on the expanding panel. Hide the logo picker while the flag dropdown is open if necessary.

  - [ ] Ensure the search input in FlagSelector stays visible and that scroll works properly when the list is long. Consider adding max-h-48 and overflow-y-auto to the dropdown.

  - [ ] Add appropriate data-testid attributes for Playwright tests (e.g. data-testid="flag-selector" and data-testid="logo-selector").

📹 **Daily.co integration**
**Eliminate duplicate DailyIframe instances**

- The lobby currently mixes two different Daily integration patterns. In Lobby.tsx a call object is created with DailyIframe.createCallObject(), while elsewhere (DailyJoinButton.tsx) the app uses useDaily() and relies on a <DailyProvider> wrapper. This duplication leads to the runtime error “Duplicate DailyIframe instances are not allowed.”

- [ ] To fix this, follow the pattern from the provided daily-react-kitchen-sink example: create the call object once via useCallFrame (from @daily-co/daily-react) and pass it into a DailyProvider. Then consume the call via useDaily() throughout your components. Concretely:

1. [ ] Remove DailyIframe.createCallObject() from Lobby.tsx. Instead, import useCallFrame and call it with an options object that sets the Daily room URL and iframeStyle. For example:

```tsx
const wrapperRef = useRef<HTMLDivElement>(null);
const callFrame = useCallFrame({
  parentElRef: wrapperRef,
  options: {
    url: dailyRoom.room_url,
    token: tokenResponse.token,
    iframeStyle: { width: "100%", height: "80vh" },
  },
  shouldCreateInstance: () =>
    Boolean(dailyRoom?.room_url && wrapperRef.current),
});
```

2. [ ] Wrap the portion of the Lobby page responsible for video calls with <DailyProvider callObject={callFrame}> and render the video UI (grid, controls, etc.) inside that provider.
3. [ ] Call callFrame.join() when the user chooses to enter the call. For example, in handleJoinDailyCall call callFrame.join({ url: dailyRoom.room_url, token: tokenResponse.token, userName: participantName }). Listen for joined-meeting and left-meeting events via useDailyEvent hooks instead of manually attaching listeners.
4. [ ] Remove DailyJoinButton.tsx or refactor it to use useDaily(); do not manually call daily?.join() if the call has already been joined by the call frame.
5. [ ] Ensure that you destroy the call frame on component unmount by using the cleanup function returned from useCallFrame, or call callFrame.destroy() in a useEffect cleanup.
6. [ ] Update any other components that directly use DailyIframe to instead use the context provided by DailyProvider.
       This approach mirrors the Prebuilt example from the kitchen‑sink demo, where a call frame is created once and passed into a provider. It prevents multiple DailyIframe instances from being created, eliminating the error.

**Token management**

- [ ] The current implementation keeps token expiry and refresh logic in DailyJoinButton.tsx. When restructuring around useCallFrame, centralise this logic in a custom hook (e.g. useDailyToken) that:
  - [ ] Requests a new token via createDailyToken() when needed.
  - [ ] Stores the token and its expiry in Jotai atoms (dailyTokenAtom, dailyTokenExpiryAtom)
  - [ ] Automatically refreshes the token a few minutes before expiry.
  - [ ] Exposes isTokenExpiring, refreshToken() and the current token for components that need them.
- [ ] Remove token handling from UI components; they should simply call join() with the provided token.

🧪 **Playwright and other tests**

- [ ] Implement or fix Playwright tests in tests/e2e/ to validate the new logo picker and Daily integration:
  - [ ] A test should navigate to /join/[session-code], select a league and a team (e.g. Real Madrid), verify the logo displays in the picker and persists through joining.
  - [ ] Another test should ensure spaces in folder names (e.g. La Liga) are handled correctly.
  - [ ] Additional tests can cover joining and leaving video calls without duplicate instances and verifying token refresh.
- [ ] Use the @supabase mcps to seed your test Supabase storage with a few logo files during the test setup.

🧠 **Other notes**

- [ ] Review and clean up any unused imports, variables or commented code in the affected files.
- [ ] Clean up unused background placeholders in Join.tsx and Lobby.tsx; remove large blocks of commented JSX that don’t render anything. This will make the code easier for Copilot to navigate.
- [ ] Ensure all network requests (Supabase and Netlify functions) handle errors gracefully and set loading states appropriately.
- [ ] When adding new images, update the content security policy in netlify.toml if required.
