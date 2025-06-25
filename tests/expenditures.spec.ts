import { test, expect } from '@playwright/test';

test('Expenditures page: all buttons and logic', async ({ page }) => {
  await page.goto('http://localhost:8080/expenditures');
  await expect(page.locator('text=Expenditure')).toBeVisible();

  // Add Expenditure
  await page.click('text=Add Expenditure');
  await page.fill('input[name="description"]', 'Test Expenditure');
  await page.fill('input[name="amount"]', '500');
  await page.click('text=Save');
  await expect(page.locator('text=Expenditure Added')).toBeVisible();

  // Edit Expenditure
  await page.click('button:has-text("Edit")');
  await page.click('text=Save');
  await expect(page.locator('text=Expenditure Updated')).toBeVisible();

  // Delete Expenditure
  await page.click('button:has-text("Delete")');
  await page.click('text=Confirm');
  await expect(page.locator('text=Expenditure Deleted')).toBeVisible();
}); 