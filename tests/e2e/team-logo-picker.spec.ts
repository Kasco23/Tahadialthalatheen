/**
 * E2E Test Example for TeamLogoPicker with Real Madrid logo
 * 
 * This is an example test that would need proper Playwright setup to run.
 * To implement this test:
 * 1. Install Playwright: pnpm add -D @playwright/test
 * 2. Set up test database with logo files in Supabase Storage
 * 3. Configure Playwright config with test environment
 */

import { test, expect } from '@playwright/test';

test.describe('TeamLogoPicker Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the join page where TeamLogoPicker is used
    await page.goto('/join/TEST123');
  });

  test('should display Real Madrid logo from La Liga folder', async ({ page }) => {
    // Wait for the logo picker to load
    await page.waitForSelector('[data-testid="team-logo-picker"]');
    
    // Wait for logos to load (should not show "No team logos available")
    await expect(page.locator('text=No team logos available')).not.toBeVisible();
    
    // Look for the Real Madrid logo
    const realMadridLogo = page.locator('[data-testid="logo-real-madrid"]');
    await expect(realMadridLogo).toBeVisible();
    
    // Click on the Real Madrid logo
    await realMadridLogo.click();
    
    // Verify the logo is selected (shows in the player card)
    await expect(page.locator('[data-testid="selected-logo"]')).toHaveAttribute(
      'src', 
      /real-madrid\.svg/
    );
  });

  test('should handle spaces in folder names correctly', async ({ page }) => {
    // This test verifies that logos from folders with spaces (like "La Liga") 
    // are properly encoded and accessible
    
    // Wait for the league selector
    await page.waitForSelector('[data-testid="league-selector"]');
    
    // Select "La Liga" league (contains space in name)
    await page.selectOption('[data-testid="league-selector"]', 'La Liga');
    
    // Verify that logos are displayed (not empty)
    const logoGrid = page.locator('[data-testid="logo-grid"]');
    const logoCount = await logoGrid.locator('img').count();
    expect(logoCount).toBeGreaterThan(0);
    
    // Verify no broken image icons (would indicate URL encoding issues)
    const brokenImages = await page.locator('img[alt="Team logo"]').evaluateAll(
      (images: HTMLImageElement[]) => 
        images.filter(img => !img.complete || img.naturalHeight === 0)
    );
    expect(brokenImages).toHaveLength(0);
  });

  test('should complete full flow: pick logo, join as player, show in lobby', async ({ page }) => {
    // Pick Real Madrid logo
    await page.click('[data-testid="logo-real-madrid"]');
    
    // Fill in player name and flag
    await page.fill('[data-testid="player-name-input"]', 'Player1');
    await page.selectOption('[data-testid="flag-selector"]', 'ES'); // Spain flag
    
    // Join the session
    await page.click('[data-testid="join-button"]');
    
    // Wait for navigation to lobby
    await page.waitForURL(/\/lobby\//);
    
    // Verify player appears in lobby with Real Madrid logo
    const playerCard = page.locator('[data-testid="player-Player1"]');
    await expect(playerCard).toBeVisible();
    await expect(playerCard.locator('img[alt="Team logo"]')).toHaveAttribute(
      'src',
      /real-madrid\.svg/
    );
  });
});

/**
 * Manual Testing Instructions:
 * 
 * 1. Start development server: pnpm dev
 * 2. Create a test session in GameSetup
 * 3. Navigate to /join/[session-code] on a mobile device or different browser
 * 4. Verify TeamLogoPicker loads and shows logos including "Real Madrid"
 * 5. Select Real Madrid logo and complete joining
 * 6. Check that the logo appears correctly in both Join and Lobby views
 * 7. Verify host shows as "Joined" (🟢) status in lobby
 * 8. Test Daily room creation by clicking "Create Daily Room" button
 */
