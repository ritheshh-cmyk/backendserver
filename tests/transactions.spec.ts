import { test, expect } from '@playwright/test';

test('Transactions page: all buttons and logic', async ({ page }) => {
  await page.goto('http://localhost:8080/transactions');
  await expect(page.locator('text=Transaction ID')).toBeVisible();

  // Add Transaction
  await page.click('text=New Transaction');
  await expect(page.locator('text=Add Transaction')).toBeVisible();
  // Fill and submit form (customize selectors as needed)
  await page.fill('input[name="customer"]', 'Test Customer');
  await page.fill('input[name="device"]', 'Test Device');
  await page.fill('input[name="cost"]', '1000');
  await page.click('text=Save');
  await expect(page.locator('text=Transaction Created')).toBeVisible();

  // Edit Transaction
  await page.click('button:has-text("Edit")');
  await expect(page.locator('text=Edit Transaction')).toBeVisible();
  await page.click('text=Save');
  await expect(page.locator('text=Transaction Updated')).toBeVisible();

  // Delete Transaction
  await page.click('button:has-text("Delete")');
  await page.click('text=Confirm');
  await expect(page.locator('text=Transaction Deleted')).toBeVisible();

  // Export
  await page.click('text=Export');

  // Show/Hide Profits
  await page.click('text=Show Profits');
  await page.click('text=Hide Profits');

  // Filter
  await page.click('text=Filter');
  await page.selectOption('select[name="status"]', 'completed');
  await expect(page.locator('text=completed')).toBeVisible();
}); 