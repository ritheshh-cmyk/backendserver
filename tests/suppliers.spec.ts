import { test, expect } from '@playwright/test';

test('Suppliers page: all buttons and logic', async ({ page }) => {
  await page.goto('http://localhost:8080/suppliers');
  await expect(page.locator('text=Supplier')).toBeVisible();

  // Add Supplier
  await page.click('text=Add Supplier');
  await page.fill('input[name="name"]', 'Test Supplier');
  await page.fill('input[name="contactPerson"]', 'Test Person');
  await page.fill('input[name="phone"]', '1234567890');
  await page.click('text=Save');
  await expect(page.locator('text=Supplier Added')).toBeVisible();

  // Record Payment
  await page.click('button:has-text("Record Payment")');
  await page.fill('input[name="amount"]', '500');
  await page.click('text=Save');
  await expect(page.locator('text=Payment Recorded')).toBeVisible();

  // Filter
  await page.click('text=Filter');
  await page.selectOption('select[name="status"]', 'active');
  await expect(page.locator('text=active')).toBeVisible();
}); 