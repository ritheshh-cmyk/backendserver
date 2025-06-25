import { test, expect } from '@playwright/test';

test('Reports page: all buttons and logic', async ({ page }) => {
  await page.goto('http://localhost:8080/reports');
  await expect(page.locator('text=Report')).toBeVisible();

  // Generate Report
  await page.click('text=Generate Report');
  await expect(page.locator('text=Report Generated')).toBeVisible();

  // Export Report
  await page.click('button:has-text("Export")');
  // Optionally check for download or toast
}); 