import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'

test('uses right-sized gallery files on high-density screens', async ({ browser, baseURL }, testInfo) => {
  const mobile = testInfo.project.name === 'mobile'
  const context = await browser.newContext({
    viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    deviceScaleFactor: mobile ? 3 : 1.25,
    isMobile: mobile,
    hasTouch: mobile,
  })
  try {
    const page = await context.newPage()
    await page.goto(baseURL)
    for (const link of await page.locator('.gallery-item').all()) {
      await link.scrollIntoViewIfNeeded()
      await link.locator('img').evaluate((image) => image.decode())
    }
    const selected = await page.locator('.gallery img').evaluateAll((images) => images.map((image) => image.currentSrc))
    expect(selected[2]).toMatch(/-1280\.avif$/)
    if (!mobile) expect(selected[5]).toMatch(/-640\.avif$/)
    const files = await Promise.all(selected.map((url) => readFile(`dist/${new URL(url).pathname.slice(new URL(baseURL).pathname.length)}`)))
    expect(files.reduce((bytes, file) => bytes + file.length, 0)).toBeLessThan(mobile ? 1250000 : 850000)
    const link = page.locator('.gallery-item').nth(2)
    await expect(link).toHaveAttribute('href', /-1600\.webp$/)
    await expect(link.locator('img')).toHaveAttribute('loading', 'lazy')
    await expect(link.locator('img')).toHaveAttribute('sizes', /^auto, /)
    await link.click()
    const viewer = page.getByRole('dialog')
    await viewer.locator('img').evaluate((image) => image.decode())
    await expect(viewer.locator('img')).not.toHaveAttribute('sizes', /auto/)
    expect(await viewer.locator('img').getAttribute('srcset')).toContain('1600w')
    await page.keyboard.press('Escape')
    if (mobile) {
      await expect(link.locator('img')).toHaveCSS('transform', 'none')
      await expect(link.locator('img')).toHaveCSS('filter', 'none')
    }
  } finally {
    await context.close()
  }
})

test('traps keyboard focus, navigates photos, and restores the opener', async ({ page }) => {
  await page.goto('./')
  const opener = page.locator('.gallery-item').first()
  await opener.focus()
  await page.keyboard.press('Enter')
  const viewer = page.getByRole('dialog', { name: 'Photo viewer' })
  await expect(viewer).toBeVisible()
  await expect(viewer.getByRole('button', { name: 'Close image' })).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(viewer.getByRole('button', { name: 'Next photo' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(viewer.getByRole('button', { name: 'Close image' })).toBeFocused()
  for (let step = 0; step < 5; step++) {
    await page.keyboard.press('Tab')
    expect(await viewer.evaluate((dialog) => dialog.contains(document.activeElement))).toBe(true)
  }
  await page.locator('header a').first().evaluate((link) => link.focus())
  expect(await viewer.evaluate((dialog) => dialog.contains(document.activeElement))).toBe(true)
  await page.keyboard.press('ArrowRight')
  await expect(viewer.getByRole('status')).toHaveText('Photo 2 of 23')
  await page.keyboard.press('ArrowLeft')
  await expect(viewer.getByRole('status')).toHaveText('Photo 1 of 23')
  await page.keyboard.press('End')
  await expect(viewer.getByRole('status')).toHaveText('Photo 23 of 23')
  await page.keyboard.press('Home')
  await expect(viewer.getByRole('status')).toHaveText('Photo 1 of 23')
  await page.keyboard.press('Escape')
  await expect(viewer).not.toBeVisible()
  await expect(opener).toBeFocused()
  await expect(page.locator('body')).not.toHaveClass(/lightbox-open/)
  await expect(page.locator('.lightbox img')).toHaveCount(0)
})

test('keeps photo proportions and supports touch controls without accumulating images', async ({ page }) => {
  await page.goto('./')
  await page.locator('.gallery-item').first().click()
  const viewer = page.getByRole('dialog', { name: 'Photo viewer' })
  for (let step = 0; step < 3; step++) {
    const image = viewer.locator('img')
    await expect.poll(() => image.evaluate((element) => element.complete && element.naturalWidth > 0)).toBe(true)
    const expectedRatio = await image.evaluate((element) => Number(element.getAttribute('width')) / Number(element.getAttribute('height')))
    const bounds = await image.boundingBox()
    expect(bounds.width / bounds.height).toBeCloseTo(expectedRatio, 2)
    expect(bounds.width).toBeLessThanOrEqual(page.viewportSize().width * 0.91)
    expect(bounds.height).toBeLessThanOrEqual(page.viewportSize().height * 0.81)
    await expect(viewer.locator('picture')).toHaveCount(1)
    await viewer.getByRole('button', { name: 'Next photo' }).click()
  }
  await viewer.getByRole('button', { name: 'Previous photo' }).click()
  await expect(viewer.getByRole('status')).toHaveText('Photo 3 of 23')
  await viewer.getByRole('button', { name: 'Close image' }).click()
  await expect(viewer).not.toBeVisible()
  await expect(page.locator('.lightbox img')).toHaveCount(0)
})

test('fits narrow phones and provides large navigation tap targets', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 })
  await page.goto('./')
  await page.evaluate(() => document.fonts.ready)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  for (const link of await page.locator('.site-header a').all()) {
    const bounds = await link.boundingBox()
    expect(bounds.width).toBeGreaterThanOrEqual(44)
    expect(bounds.height).toBeGreaterThanOrEqual(44)
  }
  await page.locator('.gallery-item').first().click()
  for (const button of await page.getByRole('dialog').getByRole('button').all()) {
    const bounds = await button.boundingBox()
    expect(bounds.width).toBeGreaterThanOrEqual(44)
    expect(bounds.height).toBeGreaterThanOrEqual(44)
  }
})

test('preserves image links when native dialogs are unsupported', async ({ page }) => {
  await page.addInitScript(() => { HTMLDialogElement.prototype.showModal = undefined })
  await page.goto('./')
  const first = page.locator('.gallery-item').first()
  const href = await first.getAttribute('href')
  await first.click()
  await expect(page).toHaveURL(new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'))
})
