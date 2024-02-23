import { expect, test as setup } from '@playwright/test'
import { env } from 'node:process'

const authFile = 'playwright/.auth/user.json'

setup('authenticate', async ({ page }) => {
  await page.goto('/')

  await page
    .getByPlaceholder('name@host.com')
    .nth(1)
    .fill(env.PLAYWRIGHT_EMAIL!)

  await page.getByPlaceholder('Password').nth(1).fill(env.PLAYWRIGHT_PASSWORD!)

  await page.getByRole('button', { name: 'submit' }).click()

  await expect(page.getByRole('link', { name: 'Contact us' })).toBeVisible()

  await page.context().storageState({ path: authFile })
})
