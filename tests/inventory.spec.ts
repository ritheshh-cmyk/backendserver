import { test, expect } from '@playwright/test';

test('Inventory page: all buttons and logic', async ({ page }) => {
  await page.goto('http://localhost:8080/inventory');
  await expect(page.locator('text=Inventory')).toBeVisible();

  // Add Inventory Item
  await page.click('text=Add Item');
  await page.fill('input[name="name"]', 'Test Item');
  await page.fill('input[name="quantity"]', '10');
  await page.fill('input[name="cost"]', '100');
  await page.click('text=Save');
  await expect(page.locator('text=Item Added')).toBeVisible();

  // Edit Item
  await page.click('button:has-text("Edit")');
  await page.click('text=Save');
  await expect(page.locator('text=Item Updated')).toBeVisible();

  // Delete Item
  await page.click('button:has-text("Delete")');
  await page.click('text=Confirm');
  await expect(page.locator('text=Item Deleted')).toBeVisible();
}); 