import { test, expect } from '@playwright/test';

test('Bills page: all buttons and logic', async ({ page }) => {
  await page.goto('http://localhost:8080/bills');
  await expect(page.locator('text=Bill')).toBeVisible();

  // Create Bill
  await page.click('text=Create Bill');
  await page.fill('input[name="customerName"]', 'Test Customer');
  await page.fill('input[name="amount"]', '2000');
  await page.click('text=Save');
  await expect(page.locator('text=Bill Created')).toBeVisible();

  // Download PDF
  await page.click('button:has-text("Download PDF")');

  // Send via WhatsApp/SMS/Email
  await page.click('button:has-text("Send via WhatsApp")');
  await expect(page.locator('text=Bill sent via WhatsApp')).toBeVisible();
}); 