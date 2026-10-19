import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { parse } from '@vue/compiler-dom'
import { photos } from '../src/photos.js'
import { site } from '../src/site-config.js'
import { imageSitemap } from './seo.mjs'

function elements(node) {
  return (node.children ?? []).flatMap((child) => child.type === 1 ? [child, ...elements(child)] : [])
}

const attr = (node, name) => node.props.find((prop) => prop.type === 6 && prop.name === name)?.value?.content
const text = (node) => (node.children ?? []).map((child) => child.type === 2 ? child.content : text(child)).join('')

export function validateSeo(html, manifest) {
  const nodes = elements(parse(html))
  const head = elements(nodes.find((node) => node.tag === 'head') ?? {})
  const tags = (tag) => head.filter((node) => node.tag === tag)
  const meta = (key, value) => tags('meta').filter((node) => attr(node, key) === value)
  const content = (key, value) => {
    const matches = meta(key, value)
    assert.equal(matches.length, 1, `SEO: expected one ${value} meta tag.`)
    return attr(matches[0], 'content')
  }

  assert.equal(tags('title').length, 1, 'SEO: expected one page title.')
  assert.equal(text(tags('title')[0]), site.title, 'SEO: incorrect page title.')
  assert.equal(content('name', 'description'), site.description, 'SEO: incorrect description.')
  const canonical = tags('link').filter((node) => attr(node, 'rel') === 'canonical')
  assert.equal(canonical.length, 1, 'SEO: expected one canonical URL.')
  assert.equal(attr(canonical[0], 'href'), site.url, 'SEO: incorrect canonical URL.')
  const robots = content('name', 'robots').toLowerCase().split(/[\s,]+/)
  assert(robots.includes('index') && robots.includes('follow') && !robots.includes('noindex') && !robots.includes('none') && !robots.includes('nofollow'), 'SEO: robots must allow indexing and link crawling.')
  assert.equal(content('property', 'og:url'), site.url, 'SEO: incorrect Open Graph URL.')
  const preview = new URL(manifest.hero.social.file, site.url).href
  assert.equal(content('property', 'og:image'), preview, 'SEO: missing social preview.')
  assert.equal(content('name', 'twitter:image'), preview, 'SEO: missing Twitter preview.')
  assert.equal(content('name', 'twitter:card'), 'summary_large_image', 'SEO: incorrect Twitter card.')

  const headings = nodes.filter((node) => node.tag === 'h1')
  assert.equal(headings.length, 1, 'SEO: expected one static H1.')
  assert.equal(text(headings[0]), site.name, 'SEO: incorrect artist heading.')
  const links = nodes.filter((node) => node.tag === 'a')
  for (const url of [site.home, site.instagram, site.soundcloud]) {
    assert(links.some((node) => attr(node, 'href') === url), `SEO: missing crawlable link to ${url}`)
  }
  const gallery = links.filter((node) => attr(node, 'data-photo'))
  assert.equal(gallery.length, photos.length, 'SEO: missing static gallery links.')
  for (const photo of photos) {
    const matches = gallery.filter((node) => attr(node, 'data-photo') === photo.file)
    assert.equal(matches.length, 1, `SEO: missing or duplicate photo ${photo.file}`)
    const image = elements(matches[0]).find((node) => node.tag === 'img')
    assert(image && attr(image, 'alt') === photo.alt, `SEO: missing photo or descriptive alt for ${photo.file}`)
    const variant = manifest.photos[photo.file].webp.at(-1)
    assert.equal(attr(matches[0], 'href'), new URL(variant.file, site.url).pathname, `SEO: incorrect photo link for ${photo.file}`)
  }

  const scripts = tags('script').filter((node) => attr(node, 'type') === 'application/ld+json')
  assert.equal(scripts.length, 1, 'SEO: missing structured data.')
  const schema = JSON.parse(text(scripts[0]))
  assert.equal(schema['@context'], 'https://schema.org', 'SEO: invalid structured data context.')
  const artist = schema['@graph']?.find((node) => node['@type'] === 'Person')
  const portfolio = schema['@graph']?.find((node) => node['@type'] === 'ImageGallery')
  assert.equal(artist?.['@id'], `${site.home}#person`, 'SEO: inconsistent artist identity.')
  assert.equal(portfolio?.url, site.url, 'SEO: missing gallery structured data.')
  assert.equal(portfolio?.about?.['@id'], artist['@id'], 'SEO: gallery must reference the artist.')
  assert.equal(portfolio?.mainEntity?.length, photos.length, 'SEO: structured data must include every photo.')
}

export async function validateSeoBuild(outputDirectory) {
  const manifest = JSON.parse(await readFile(new URL('../src/generated/images.json', import.meta.url), 'utf8'))
  validateSeo(await readFile(resolve(outputDirectory, 'index.html'), 'utf8'), manifest)
  assert.equal(await readFile(resolve(outputDirectory, 'sitemap.xml'), 'utf8'), imageSitemap(manifest), 'SEO: missing or outdated image sitemap.')
  const assets = [manifest.hero.social.file, ...photos.map((photo) => manifest.photos[photo.file].webp.at(-1).file)]
  for (const file of assets) await access(resolve(outputDirectory, file))
  console.log(`Validated static SEO, social preview, and ${photos.length} sitemap images.`)
}
