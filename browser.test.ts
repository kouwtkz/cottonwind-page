import { test } from '@playwright/test';

test('test browser', async ({ page }) => {
  // ブラウザが起動した時に表示されるページ
  page.goto('http://localhost:5173/');

  await page.pause();
});