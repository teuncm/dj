import { readFile, readdir } from 'node:fs/promises'
import { test, expect } from '@playwright/test'
import sharp from 'sharp'
import { gzipSync } from 'node:zlib'
import { galleryWidths, imageWidths } from '../src/image-config.js'

test('published images have correct dimensions and originals are excluded', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'The artifact is shared by both browser projects.')
  const manifest = JSON.parse(await readFile('src/generated/images.json', 'utf8'))
  const photos = Object.values(manifest.photos)
  expect(photos).toHaveLength(23)
  for (const image of [...photos, manifest.hero.mobile]) {
    for (const format of ['avif', 'webp']) {
      const requested = image === manifest.hero.mobile ? imageWidths : [...imageWidths, ...galleryWidths]
      expect(image[format].map(({ width }) => width)).toEqual([...new Set(requested.map((width) => Math.min(width, image.width)))].sort((a, b) => a - b))
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

test('keeps the delivered scripts and fonts within their loading budgets', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'The artifact is shared by both browser projects.')
  const assets = await readdir('dist/assets')
  const scripts = await Promise.all(assets.filter((file) => file.endsWith('.js')).map((file) => readFile(`dist/assets/${file}`)))
  const fonts = await Promise.all(assets.filter((file) => file.endsWith('.woff2')).map((file) => readFile(`dist/assets/${file}`)))
  expect(scripts.reduce((bytes, script) => bytes + gzipSync(script).length, 0)).toBeLessThan(4000)
  expect(fonts).toHaveLength(2)
  expect(fonts.reduce((bytes, font) => bytes + font.length, 0)).toBeLessThan(40000)
})
