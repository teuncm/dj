import { readFile, readdir } from 'node:fs/promises'
import { test, expect } from '@playwright/test'
import sharp from 'sharp'

test('published images have correct dimensions and originals are excluded', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'The artifact is shared by both browser projects.')
  const manifest = JSON.parse(await readFile('src/generated/images.json', 'utf8'))
  const photos = Object.values(manifest.photos)
  expect(photos).toHaveLength(23)
  for (const image of [...photos, manifest.hero.mobile]) {
    for (const format of ['avif', 'webp']) {
      for (const variant of image[format]) {
        const metadata = await sharp(`dist/${variant.file}`).metadata()
        expect(metadata.width).toBe(variant.width)
        expect(metadata.width).toBeLessThanOrEqual(image.width)
        expect(metadata.height / metadata.width).toBeCloseTo(image.height / image.width, 2)
      }
    }
  }
  expect((await readdir('dist')).some((file) => /\.jpe?g$/i.test(file))).toBe(false)
  expect((await readdir('dist/optimized')).every((file) => /-[0-9a-f]{12}-\d+\.(avif|webp|jpg)$/.test(file))).toBe(true)
  const social = await sharp(`dist/${manifest.hero.social.file}`).metadata()
  expect(social.format).toBe('jpeg')
  expect(social.width).toBe(1200)
  expect(social.height).toBe(630)
})
