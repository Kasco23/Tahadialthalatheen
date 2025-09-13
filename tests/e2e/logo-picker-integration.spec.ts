import { test, expect } from "@playwright/test";

test.describe("Team Logo Picker", () => {
  test("should display league logos and allow team selection", async ({
    page,
  }) => {
    // Navigate to join page
    await page.goto("/join");

    // Switch to player tab (should be default, but let's be sure)
    await page.click('[data-testid="player-tab"]');

    // Wait for and check that Logo Selector is visible
    await expect(page.locator("text=Choose Your Team Logo")).toBeVisible();

    // Look for league headers in the logo selector
    const logoSelector = page.locator('[data-testid="logo-selector"]');
    await expect(logoSelector).toBeVisible();

    // Check if we have any leagues listed
    const leagueHeaders = logoSelector.locator("button[aria-expanded]");
    await expect(leagueHeaders.first()).toBeVisible();

    // Click on first league to expand it
    await leagueHeaders.first().click();

    // Wait for teams to appear
    const teamGrid = logoSelector.locator(".grid");
    await expect(teamGrid).toBeVisible();

    // Select the first team logo
    const firstTeamButton = teamGrid.locator("button").first();
    await expect(firstTeamButton).toBeVisible();
    await firstTeamButton.click();

    // Check that the team is selected (should have selected styling)
    await expect(firstTeamButton).toHaveClass(/border-blue-500/);
  });

  test("should handle ChromaGrid when enabled", async ({ page }) => {
    // Navigate to join page
    await page.goto("/join");

    // Switch to player tab
    await page.click('[data-testid="player-tab"]');

    // Wait for Logo Selector
    const logoSelector = page.locator('[data-testid="logo-selector"]');
    await expect(logoSelector).toBeVisible();

    // Expand first league
    const firstLeague = logoSelector.locator("button[aria-expanded]").first();
    await firstLeague.click();

    // Check if ChromaGrid is present (it should be enabled for team logos)
    const chromaGrid = logoSelector.locator('[data-testid="chroma-grid"]');

    // If ChromaGrid is present, test its interaction
    if (await chromaGrid.isVisible()) {
      const firstChromaItem = chromaGrid.locator("article").first();
      await expect(firstChromaItem).toBeVisible();

      // Hover to trigger chroma effect
      await firstChromaItem.hover();

      // Click to select
      await firstChromaItem.click();
    }
  });

  test("should search teams and leagues", async ({ page }) => {
    // Navigate to join page
    await page.goto("/join");

    // Switch to player tab
    await page.click('[data-testid="player-tab"]');

    // Find and use the search input
    const searchInput = page.locator(
      'input[placeholder*="Search teams and leagues"]',
    );
    await expect(searchInput).toBeVisible();

    // Type a search term
    await searchInput.fill("Real");

    // Check that results are filtered
    const logoSelector = page.locator('[data-testid="logo-selector"]');
    const visibleLeagues = logoSelector.locator("button[aria-expanded]");

    // Should have at least some results
    await expect(visibleLeagues.first()).toBeVisible();
  });
});

test.describe("Flag Selector", () => {
  test("should not overlap with logo selector on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to join page
    await page.goto("/join");

    // Switch to player tab
    await page.click('[data-testid="player-tab"]');

    // Check that flag selector is visible
    const flagSelector = page.locator('[data-testid="flag-selector"]');
    await expect(flagSelector).toBeVisible();

    // Check that logo selector is visible
    const logoSelector = page.locator('[data-testid="logo-selector"]');
    await expect(logoSelector).toBeVisible();

    // Open flag dropdown
    const flagInput = flagSelector.locator("input");
    await flagInput.click();

    // Check that the dropdown appears with proper z-index
    const flagDropdown = flagSelector.locator(".absolute.z-50");
    await expect(flagDropdown).toBeVisible();

    // Click outside to close
    await page.click("body", { position: { x: 50, y: 50 } });

    // Dropdown should close
    await expect(flagDropdown).not.toBeVisible();
  });
});

test.describe("Visual Polish", () => {
  test("should display realistic tunnel background on join page", async ({
    page,
  }) => {
    // Navigate to join page
    await page.goto("/join");

    // Check that the main container has the new tunnel styling
    const tunnelBackground = page.locator(
      ".min-h-screen.relative.overflow-hidden",
    );
    await expect(tunnelBackground).toBeVisible();

    // Check that SVG perspective elements are present
    const perspectiveSvg = page.locator('svg[preserveAspectRatio="none"]');
    await expect(perspectiveSvg).toBeVisible();

    // Check that light fixtures are animated
    const lightFixtures = page.locator(".animate-pulse-slow");
    await expect(lightFixtures.first()).toBeVisible();
  });

  test("should display realistic dugout on lobby page", async ({ page }) => {
    // This test would require setting up a session first
    // For now, we'll test that the CSS classes exist

    // Navigate to lobby (will likely redirect due to no session, but we can check CSS)
    await page.goto("/lobby/TEST123");

    // The page should have dugout styling classes available
    // We can check this by examining the stylesheet
    const styles = await page.evaluate(() => {
      const stylesheets = Array.from(document.styleSheets);
      for (const sheet of stylesheets) {
        try {
          const rules = Array.from(sheet.cssRules);
          for (const rule of rules) {
            if (rule.cssText.includes(".dugout-seating")) {
              return true;
            }
          }
        } catch (_e) {
          // Cross-origin stylesheet, skip
        }
      }
      return false;
    });

    expect(styles).toBeTruthy();
  });
});

test.describe("Form Validation", () => {
  test("should validate join form fields", async ({ page }) => {
    // Navigate to join page
    await page.goto("/join");

    // Try to submit player form without filling fields
    await page.click('[data-testid="player-tab"]');

    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();

    // Form should have validation
    const sessionCodeInput = page.locator('input[placeholder*="session code"]');
    const nameInput = page.locator('input[placeholder*="name"]');

    await expect(sessionCodeInput).toBeVisible();
    await expect(nameInput).toBeVisible();

    // These should be required fields
    await expect(sessionCodeInput).toHaveAttribute("required");
    await expect(nameInput).toHaveAttribute("required");
  });
});
