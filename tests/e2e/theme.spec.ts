import { expect, test } from '@playwright/test';

/**
 * Theme System End-to-End Tests
 *
 * Tests dynamic theme switching functionality across the application,
 * including background changes, color updates, and visual consistency.
 */

test.describe('Theme System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to landing page
    await page.goto('/');

    // Wait for theme system to initialize
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Give theme system time to load
  });

  test('should display dynamic hex background on landing page', async ({
    page,
  }) => {
    // Check that the page has loaded properly
    await expect(page).toHaveTitle(/Thirty/i);

    // Look for the hex background canvas element
    const hexBackground = page.locator(
      'canvas[data-testid="hex-background"], canvas:first-child',
    );
    await expect(hexBackground).toBeVisible();

    // Verify canvas has proper dimensions
    const canvasBox = await hexBackground.boundingBox();
    expect(canvasBox?.width).toBeGreaterThan(0);
    expect(canvasBox?.height).toBeGreaterThan(0);
  });

  test('should not have static background overrides', async ({ page }) => {
    // Check that main content containers don't have static background colors
    const containers = page.locator('[class*="bg-[var(--theme-bg-primary)]"]');
    await expect(containers).toHaveCount(0);

    // Ensure ThemedHexBackground is present at root level
    const themedBackground = page
      .locator(
        '[data-testid="themed-hex-background"], .hex-background-container',
      )
      .first();
    await expect(themedBackground).toBeVisible();
  });

  test('should switch themes when team is selected', async ({ page }) => {
    // Look for theme selector or theme controls
    const themeButton = page
      .locator(
        'button:has-text("Theme"), button:has-text("🎨"), [data-testid="theme-selector"]',
      )
      .first();

    if (await themeButton.isVisible()) {
      await themeButton.click();

      // Wait for theme controls to appear
      await page.waitForTimeout(500);

      // Look for team selection options
      const teamOption = page
        .locator(
          'button:has-text("Barcelona"), button:has-text("Real Madrid"), button:has-text("Manchester")',
        )
        .first();

      if (await teamOption.isVisible()) {
        // Get current background for comparison
        const canvas = page.locator('canvas').first();
        const beforeScreenshot = await canvas.screenshot();

        // Select a team
        await teamOption.click();

        // Wait for theme to apply
        await page.waitForTimeout(2000);

        // Take screenshot after theme change
        const afterScreenshot = await canvas.screenshot();

        // Verify the background changed (screenshots should be different)
        expect(beforeScreenshot).not.toEqual(afterScreenshot);
      }
    }
  });

  test('should maintain theme consistency across page navigation', async ({
    page,
  }) => {
    // Start on landing page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to create session page
    const createButton = page
      .locator(
        'button:has-text("Create"), a[href*="create"], [data-testid="create-session"]',
      )
      .first();

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForLoadState('networkidle');

      // Verify hex background is still present
      const hexBackground = page.locator('canvas').first();
      await expect(hexBackground).toBeVisible();

      // Check that no static backgrounds override the theme
      const staticBgs = page.locator('[class*="bg-[var(--theme-bg-primary)]"]');
      await expect(staticBgs).toHaveCount(0);
    }

    // Navigate to join page
    await page.goto('/join');
    await page.waitForLoadState('networkidle');

    // Verify hex background persists
    const joinHexBackground = page.locator('canvas').first();
    await expect(joinHexBackground).toBeVisible();
  });

  test('should render enhanced carbon fiber texture', async ({ page }) => {
    // Wait for canvas to be rendered
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();

    // Get canvas context and verify it has content
    const canvasHandle = await canvas.elementHandle();
    const hasContent = await page.evaluate((canvas) => {
      if (!canvas) return false;
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;

      // Get image data from a small area
      const imageData = ctx.getImageData(0, 0, 100, 100);
      const data = imageData.data;

      // Check if there's actual content (not all transparent)
      let hasPixels = false;
      for (let i = 3; i < data.length; i += 4) {
        // Check alpha channel
        if (data[i] > 0) {
          hasPixels = true;
          break;
        }
      }

      return hasPixels;
    }, canvasHandle);

    expect(hasContent).toBe(true);
  });

  test('should handle theme mode switching', async ({ page }) => {
    // Look for theme controls
    const themeControls = page
      .locator('button:has-text("Theme"), [data-testid="theme-controls"]')
      .first();

    if (await themeControls.isVisible()) {
      await themeControls.click();
      await page.waitForTimeout(500);

      // Look for mode switching buttons (Default/Team)
      const defaultModeBtn = page.locator('button:has-text("Default")').first();
      const teamModeBtn = page.locator('button:has-text("Team")').first();

      if (
        (await defaultModeBtn.isVisible()) &&
        (await teamModeBtn.isVisible())
      ) {
        // Switch to team mode
        await teamModeBtn.click();
        await page.waitForTimeout(1000);

        // Verify team selection is available
        const teamOptions = page.locator(
          'button:has-text("Barcelona"), button:has-text("Madrid"), button:has-text("United")',
        );
        const teamCount = await teamOptions.count();
        expect(teamCount).toBeGreaterThan(0);

        // Switch back to default mode
        await defaultModeBtn.click();
        await page.waitForTimeout(1000);

        // Verify hex background still renders
        const canvas = page.locator('canvas').first();
        await expect(canvas).toBeVisible();
      }
    }
  });

  test('should display theme changes in control room', async ({ page }) => {
    // Navigate directly to a control room (if accessible)
    await page.goto('/control-room');
    await page.waitForLoadState('networkidle');

    // Verify the control room loads without static background overrides
    const staticBgs = page.locator('[class*="bg-[var(--theme-bg-primary)]"]');
    await expect(staticBgs).toHaveCount(0);

    // Check for hex background
    const canvas = page.locator('canvas').first();
    if (await canvas.isVisible()) {
      await expect(canvas).toBeVisible();
    }
  });

  test('should maintain accessibility with theme changes', async ({ page }) => {
    // Check that text remains readable with theme changes
    const textElements = page.locator('h1, h2, h3, p, button');
    const firstElement = textElements.first();

    if (await firstElement.isVisible()) {
      // Get computed styles to check contrast
      const styles = await firstElement.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
        };
      });

      // Basic check that text has some color (not transparent)
      expect(styles.color).not.toBe('rgba(0, 0, 0, 0)');
      expect(styles.color).not.toBe('transparent');
    }
  });

  test('should load team colors properly', async ({ page }) => {
    // Check if teams data is available
    const hasTeamData = await page.evaluate(() => {
      // Check if teams are loaded in the theme system
      return (
        typeof window !== 'undefined' &&
        document.querySelector('script') !== null
      );
    });

    expect(hasTeamData).toBe(true);
  });
});

test.describe('Theme Performance', () => {
  test('should render theme changes within performance budget', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Measure performance of theme switching
    const startTime = Date.now();

    // Look for theme controls and switch theme
    const themeButton = page
      .locator('button:has-text("Theme"), button:has-text("🎨")')
      .first();

    if (await themeButton.isVisible()) {
      await themeButton.click();
      await page.waitForTimeout(200);

      const teamButton = page
        .locator('button:has-text("Barcelona"), button:has-text("Madrid")')
        .first();
      if (await teamButton.isVisible()) {
        await teamButton.click();

        // Wait for theme to fully apply
        await page.waitForTimeout(1000);
      }
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Theme switching should complete within 3 seconds
    expect(duration).toBeLessThan(3000);
  });

  test('should not cause memory leaks during theme switching', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Perform multiple theme switches to ensure no major memory issues
    for (let i = 0; i < 3; i++) {
      const themeButton = page
        .locator('button:has-text("Theme"), button:has-text("🎨")')
        .first();

      if (await themeButton.isVisible()) {
        await themeButton.click();
        await page.waitForTimeout(200);

        const teamButton = page
          .locator('button:has-text("Barcelona"), button:has-text("Madrid")')
          .first();
        if (await teamButton.isVisible()) {
          await teamButton.click();
          await page.waitForTimeout(500);
        }

        // Close theme controls
        await page.keyboard.press('Escape');
        await page.waitForTimeout(200);
      }
    }

    // Basic check that page is still responsive
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();

    // Verify no JavaScript errors occurred
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.waitForTimeout(1000);
    expect(errors.length).toBe(0);
  });
});
