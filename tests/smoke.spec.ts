import { expect, test } from '@playwright/test'
import { env } from 'node:process'
import 'dotenv/config'

test('smoke', async ({ page, isMobile }) => {
  await page.goto('/')

  console.log('isMobile', isMobile)
  const n = isMobile ? 0 : 1

  await page
    .getByPlaceholder('name@host.com')
    .nth(n)
    .fill(env.PLAYWRIGHT_EMAIL!)

  await page.getByPlaceholder('Password').nth(n).fill(env.PLAYWRIGHT_PASSWORD!)

  await page.getByRole('button', { name: 'submit' }).click()

  await expect(
    page.getByRole('heading', { name: 'Login Successful' })
  ).toBeVisible()

  await page.getByRole('link', { name: 'Logout' }).click()

  await expect(page.getByPlaceholder('name@host.com').nth(n)).toBeAttached()
})
