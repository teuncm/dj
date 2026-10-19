import { test, expect } from '@playwright/test'

test('loads the responsive hero once, uses local fonts, and defers most photos', async ({ page }, testInfo) => {
  const requests = []
  const failures = []
  const imageResponses = []
  page.on('request', (request) => requests.push(request.url()))
  page.on('pageerror', (error) => failures.push(error.message))
  page.on('console', (message) => {
    if (/hydration/i.test(message.text())) failures.push(message.text())
  })
  page.on('response', (response) => {
    if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`)
    if (/\.(avif|webp)$/.test(response.url())) imageResponses.push(response)
  })
  await page.goto('./')
  const hero = page.locator('.hero img')
  await expect(hero).toHaveJSProperty('complete', true)
  await expect.poll(() => hero.evaluate((image) => image.naturalWidth)).toBeGreaterThan(0)
  await page.evaluate(() => document.fonts.ready)

  const selected = await hero.evaluate((image) => image.currentSrc)
  expect(selected).toContain('Flagchella-160')
  expect(selected).toMatch(/\.avif$/)
  expect(selected.includes('-mobile-')).toBe(testInfo.project.name === 'mobile')
  expect(requests.filter((url) => url === selected)).toHaveLength(1)
  expect(requests.every((url) => url.startsWith('http://127.0.0.1:4173/'))).toBe(true)
  expect(requests.some((url) => /\.woff2$/.test(url))).toBe(true)
  const mobile = testInfo.project.name === 'mobile'
  expect(requests.filter((url) => /\.(avif|webp)$/.test(url)).length).toBeLessThanOrEqual(mobile ? 4 : 6)
  const imageBytes = (await Promise.all(imageResponses.map(async (response) => (await response.body()).length)))
    .reduce((total, bytes) => total + bytes, 0)
  expect(imageBytes).toBeLessThan(mobile ? 250000 : 350000)
  expect(requests.some((url) => /\.jpe?g$/i.test(url))).toBe(false)
  expect(failures).toEqual([])
  await expect(page.locator('.gallery-item')).toHaveCount(23)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('discovers the hero before the app JavaScript runs', async ({ page }) => {
  let release
  const gate = new Promise((resolve) => { release = resolve })
  const images = []
  page.on('request', (request) => {
    if (/\.avif$/.test(request.url())) images.push(request.url())
  })
  await page.route('**/assets/*.js', async (route) => {
    await gate
    await route.continue()
  })
  try {
    await page.goto('./', { waitUntil: 'commit' })
    await expect.poll(() => images.length).toBeGreaterThan(0)
    expect(images[0]).toContain('Flagchella-160')
  } finally {
    release()
  }
  await expect(page.locator('.hero img')).toBeVisible()
})

test('loads every gallery photo on scroll and opens a fitted lightbox', async ({ page }) => {
  await page.goto('./')
  for (const button of await page.locator('.gallery-item').all()) {
    await button.scrollIntoViewIfNeeded()
    await expect.poll(() => button.locator('img').evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true)
  }
  const portrait = page.locator('.gallery-item').filter({ has: page.locator('img[alt*="red stage lights"]') })
  await portrait.click()
  const modal = page.getByRole('dialog')
  await expect(modal).toBeVisible()
  const image = modal.locator('img')
  await expect.poll(() => image.evaluate((element) => element.complete && element.naturalWidth > 0)).toBe(true)
  expect(await image.evaluate((element) => element.currentSrc)).toMatch(/\.avif$/)
  const bounds = await image.boundingBox()
  expect(bounds.width).toBeLessThanOrEqual(page.viewportSize().width)
  expect(bounds.height).toBeLessThanOrEqual(page.viewportSize().height * 0.89)
  await page.keyboard.press('Escape')
  await expect(modal).toHaveCount(0)
  await expect(page.locator('body')).not.toHaveClass(/lightbox-open/)
})

test('falls back to responsive WebP when AVIF is unsupported', async ({ page }) => {
  // Make AVIF sources unsupported without changing the responsive WebP fallbacks.
  await page.route('**/assets/*.js', async (route) => {
    const response = await route.fetch()
    await route.fulfill({ response, body: (await response.text()).replaceAll('image/avif', 'image/unsupported') })
  })
  await page.route('**/dj/', async (route) => {
    const response = await route.fetch()
    await route.fulfill({ response, body: (await response.text()).replaceAll('image/avif', 'image/unsupported') })
  })
  await page.goto('./')
  const image = page.locator('.hero img')
  await expect.poll(() => image.evaluate((element) => element.complete && element.naturalWidth > 0)).toBe(true)
  expect(await image.evaluate((element) => element.currentSrc)).toMatch(/\.webp$/)
})
