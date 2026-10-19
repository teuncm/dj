[link](https://teuncm.nl/dj)

Run `npm install` and `npm run dev` to work locally. `npm run build` generates the optimized images and the static site in `dist`.

Keep original photos in `public`. The optimizer creates AVIF and WebP sizes without enlarging small originals, and uses content hashes to skip unchanged files. Set the header photo in `src/image-config.js`; its mobile crop and responsive preloads are generated automatically.

The first build encodes every photo and takes longer. Subsequent builds reuse the generated files, including through the GitHub Actions image cache.

Only the current optimized images, local fonts, and site assets are published. Original photos stay in the repository. Generated files are ignored by Git and recreated before development or production builds.

Run `npm test` for mobile and desktop browser checks. Tests use an installed Edge browser on Windows; elsewhere install Chromium with `npx playwright install chromium` first.

The production build pre-renders the portfolio into HTML and hydrates it for the lightbox. Photos remain available through normal image links when JavaScript is disabled, with native lazy loading and responsive AVIF/WebP sources.

SEO settings live in `src/site-config.js`. The build adds a canonical URL, search metadata, Open Graph and Twitter previews, artist/gallery JSON-LD, and a 1200x630 JPEG share image. `dist/sitemap.xml` lists the canonical portfolio URL and its published photos, and updates whenever the gallery changes.

For discovery, submit `https://teuncm.nl/dj/sitemap.xml` in Google Search Console, or add the following line to the existing **domain-root** `https://teuncm.nl/robots.txt`:

```text
Sitemap: https://teuncm.nl/dj/sitemap.xml
```

This repository deploys under `/dj/`, so it cannot manage the root website's robots file. A `/dj/robots.txt` file would not control crawling. See [Google's sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) and [robots.txt placement requirements](https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec).

The [live main-site audit and integration notes](docs/main-site-seo.md) record the verified SoundCloud URL and the remaining root-site changes. Portfolio structured data uses the existing homepage Person and WebSite identifiers; profile URLs and identity settings live in `src/site-config.js`.
