import { expect, test } from '@playwright/test'

test('smoke', async ({ page }) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', { name: 'Login Successful' })
  ).toBeVisible()

  await page.getByRole('link', { name: 'Logout' }).click()

  await expect(page.getByPlaceholder('name@host.com')).toBeVisible()
})
