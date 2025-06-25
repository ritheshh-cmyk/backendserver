import { test, expect } from '@playwright/test';

test('Customers page: all buttons and logic', async ({ page }) => {
  await page.goto('http://localhost:8080/customers');
  await expect(page.locator('text=Customer')).toBeVisible();

  // Add Customer
  await page.click('text=Add Customer');
  await page.fill('input[name="name"]', 'Test Customer');
  await page.fill('input[name="phone"]', '1234567890');
  await page.click('text=Save');
  await expect(page.locator('text=Customer Added')).toBeVisible();

  // Edit Customer
  await page.click('button:has-text("Edit")');
  await page.click('text=Save');
  await expect(page.locator('text=Customer Updated')).toBeVisible();

  // Delete Customer
  await page.click('button:has-text("Delete")');
  await page.click('text=Confirm');
  await expect(page.locator('text=Customer Deleted')).toBeVisible();
}); 