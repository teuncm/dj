import { readFile } from 'node:fs/promises'
import { test, expect } from '@playwright/test'
import { site } from '../src/site-config.js'
import { photos } from '../src/photos.js'
import { validateSeo } from '../scripts/validate-seo.mjs'

test('build guard rejects SEO regressions before publication', async ({}, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Build artifact checks are shared across viewports.')
  const html = await readFile('dist/index.html', 'utf8')
  const manifest = JSON.parse(await readFile('src/generated/images.json', 'utf8'))
  expect(() => validateSeo(html, manifest)).not.toThrow()
  const regressions = [
    [html.replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/, ''), /static H1/],
    [html.replace('rel="canonical"', 'rel="alternate"'), /canonical URL/],
    [html.replace('index, follow, max-image-preview:large', 'noindex, follow'), /allow indexing/],
    [html.replace('data-photo="', 'data-removed="'), /gallery links/],
    [html.replace('application/ld+json', 'application/json'), /structured data/],
  ]
  for (const [broken, message] of regressions) expect(() => validateSeo(broken, manifest)).toThrow(message)
})

test('serves the portfolio and image links with JavaScript disabled', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  try {
    const page = await context.newPage()
    await page.goto(baseURL)
    await expect(page.getByRole('heading', { level: 1, name: 'Tune:M' })).toHaveCount(1)
    await expect(page.locator('.gallery-item')).toHaveCount(photos.length)
    await expect(page.locator('.gallery img')).toHaveCount(photos.length)
    await expect(page.locator('footer').getByRole('link', { name: 'teuncm.nl', exact: true })).toHaveAttribute('href', site.home)
    await expect(page.locator(`a[href="${site.soundcloud}"]`)).toHaveCount(3)
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'teuncm.nl' }))
      .toHaveAttribute('href', site.home)
    const first = page.locator('.gallery-item').first()
    const href = await first.getAttribute('href')
    expect(href).toMatch(/^\/dj\/optimized\/.*\.webp$/)
    await first.click()
    await expect(page).toHaveURL(new URL(href, site.url).href.replace('https://teuncm.nl', new URL(baseURL).origin))
  } finally {
    await context.close()
  }
})

test('has consistent canonical, search metadata, and social previews', async ({ page, request }) => {
  await page.goto('./')
  await expect(page).toHaveTitle(site.title)
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', site.description)
  await expect(page.locator('meta[name="author"]')).toHaveAttribute('content', site.personName)
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', site.url)
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', site.url)
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', site.title)
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow, max-image-preview:large')
  const image = await page.locator('meta[property="og:image"]').getAttribute('content')
  expect(image).toMatch(/^https:\/\/teuncm\.nl\/dj\/optimized\/.*\.jpg$/)
  const response = await request.get(new URL(image).pathname)
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toContain('image/jpeg')
})

test('includes valid artist and gallery data plus a complete image sitemap', async ({ page, request }) => {
  await page.goto('./')
  const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent())
  expect(schema['@context']).toBe('https://schema.org')
  const artist = schema['@graph'].find((node) => node['@type'] === 'Person')
  expect(artist['@id']).toBe('https://teuncm.nl/#person')
  expect(artist.name).toBe(site.personName)
  expect(artist.alternateName).toContain(site.name)
  expect(artist.sameAs).toEqual([site.instagram, site.soundcloud, site.github, site.linkedin])
  expect(artist.url).toBe(site.home)
  const website = schema['@graph'].find((node) => node['@type'] === 'WebSite')
  expect(website['@id']).toBe('https://teuncm.nl/#website')
  expect(website.publisher['@id']).toBe(artist['@id'])
  const gallery = schema['@graph'].find((node) => node['@type'] === 'ImageGallery')
  expect(gallery.url).toBe(site.url)
  expect(gallery.isPartOf['@id']).toBe(website['@id'])
  expect(gallery.about['@id']).toBe(artist['@id'])
  expect(gallery.mainEntity).toHaveLength(photos.length)
  const breadcrumb = schema['@graph'].find((node) => node['@type'] === 'BreadcrumbList')
  expect(gallery.breadcrumb['@id']).toBe(breadcrumb['@id'])
  expect(breadcrumb.itemListElement.map((item) => item.item)).toEqual([site.home, site.url])
  const response = await request.get('sitemap.xml')
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toContain('xml')
  const sitemap = await response.text()
  const parsed = await page.evaluate((xml) => {
    const doc = new DOMParser().parseFromString(xml, 'application/xml')
    return {
      errors: doc.querySelectorAll('parsererror').length,
      canonical: doc.getElementsByTagName('loc')[0]?.textContent,
      images: [...doc.getElementsByTagNameNS('http://www.google.com/schemas/sitemap-image/1.1', 'loc')].map((node) => node.textContent),
    }
  }, sitemap)
  expect(parsed.errors).toBe(0)
  expect(parsed.canonical).toBe(site.url)
  expect(new Set(parsed.images).size).toBe(photos.length)
  for (const url of parsed.images) expect((await request.get(new URL(url).pathname)).status()).toBe(200)
})

test('writes headings, links, descriptions, and photos directly into the build HTML', async () => {
  const html = await readFile('dist/index.html', 'utf8')
  expect(html).not.toContain('<!--app-html-->')
  expect(html).toContain('<h1')
  expect(html).toContain(site.home)
  expect(html).toContain(site.url)
  expect(html).toContain(site.soundcloud)
  const charset = /<meta charset="UTF-8"\s*\/?>/.exec(html)
  expect(charset).not.toBeNull()
  expect(Buffer.byteLength(html.slice(0, charset.index + charset[0].length))).toBeLessThanOrEqual(1024)
  for (const photo of photos) expect(html).toContain(`data-photo="${photo.file}"`)
})
