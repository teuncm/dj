import { photos } from '../src/photos.js'
import { site } from '../src/site-config.js'

const absolute = (file) => new URL(file, site.url).href
const largest = (image) => image.webp.at(-1)
const imageAlt = 'Tune:M mixing at Flagchella with dancers behind the booth'

export function seoTags(manifest) {
  const preview = manifest.hero.social
  const previewUrl = absolute(preview.file)
  const personId = `${site.home}#person`
  const websiteId = `${site.home}#website`
  const breadcrumbId = `${site.url}#breadcrumb`
  const galleryId = `${site.url}#portfolio`
  const previewId = `${site.url}#primaryimage`
  const imageObjects = photos.map((photo) => {
    const image = manifest.photos[photo.file]
    const variant = largest(image)
    return {
      '@type': 'ImageObject',
      '@id': `${site.url}#photo-${encodeURIComponent(photo.file)}`,
      name: photo.alt,
      caption: photo.alt,
      contentUrl: absolute(variant.file),
      thumbnailUrl: absolute(image.webp[0].file),
      encodingFormat: 'image/webp',
      width: variant.width,
      height: Math.round(variant.width * image.height / image.width),
      about: { '@id': personId },
    }
  })
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': websiteId,
        url: site.home,
        name: site.personName,
        inLanguage: 'en',
        publisher: { '@id': personId },
      },
      {
        '@type': 'Person',
        '@id': personId,
        name: site.personName,
        alternateName: site.alternateNames,
        jobTitle: 'DJ',
        url: site.home,
        sameAs: [site.instagram, site.soundcloud, site.github, site.linkedin],
        mainEntityOfPage: { '@id': `${site.home}#profile` },
        subjectOf: { '@id': galleryId },
        image: { '@id': previewId },
      },
      {
        '@type': 'ImageGallery',
        '@id': galleryId,
        url: site.url,
        name: site.title,
        description: site.description,
        inLanguage: 'en',
        isPartOf: { '@id': websiteId },
        breadcrumb: { '@id': breadcrumbId },
        about: { '@id': personId },
        primaryImageOfPage: { '@id': previewId },
        mainEntity: imageObjects.map((image) => ({ '@id': image['@id'] })),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': breadcrumbId,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'teuncm.nl', item: site.home },
          { '@type': 'ListItem', position: 2, name: site.name, item: site.url },
        ],
      },
      {
        '@type': 'ImageObject',
        '@id': previewId,
        contentUrl: previewUrl,
        encodingFormat: 'image/jpeg',
        width: preview.width,
        height: preview.height,
        caption: imageAlt,
      },
      ...imageObjects,
    ],
  }
  const named = (name, content) => ({ tag: 'meta', attrs: { name, content } })
  const property = (name, content) => ({ tag: 'meta', attrs: { property: name, content } })
  return [
    { tag: 'title', children: site.title },
    named('description', site.description),
    named('author', site.personName),
    named('robots', 'index, follow, max-image-preview:large'),
    { tag: 'link', attrs: { rel: 'canonical', href: site.url } },
    property('og:type', 'website'),
    property('og:site_name', site.name),
    property('og:title', site.title),
    property('og:description', site.description),
    property('og:url', site.url),
    property('og:locale', 'en_GB'),
    property('og:image', previewUrl),
    property('og:image:type', 'image/jpeg'),
    property('og:image:width', String(preview.width)),
    property('og:image:height', String(preview.height)),
    property('og:image:alt', imageAlt),
    named('twitter:card', 'summary_large_image'),
    named('twitter:title', site.title),
    named('twitter:description', site.description),
    named('twitter:image', previewUrl),
    named('twitter:image:alt', imageAlt),
    {
      tag: 'script',
      attrs: { type: 'application/ld+json' },
      children: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
    },
  ].map((tag) => ({ ...tag, injectTo: 'head' }))
}

export function imageSitemap(manifest) {
  const escape = (value) => value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
  })[character])
  const images = photos.map((photo) => {
    const url = absolute(largest(manifest.photos[photo.file]).file)
    return `    <image:image><image:loc>${escape(url)}</image:loc></image:image>`
  }).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${escape(site.url)}</loc>
${images}
  </url>
</urlset>\n`
}
