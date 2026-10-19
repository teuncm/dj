[link](https://teuncm.nl/dj)

Run `npm install` and `npm run dev` to work locally. `npm run build` generates the optimized images and the static site in `dist`.

Keep original photos in `public`. The optimizer creates AVIF and WebP sizes without enlarging small originals, and uses content hashes to skip unchanged files. Set the header photo in `src/image-config.js`; its mobile crop and responsive preloads are generated automatically.

The first build encodes every photo and takes longer. Subsequent builds reuse the generated files, including through the GitHub Actions image cache.

Only the current optimized images, local fonts, and site assets are published. Original photos stay in the repository. Generated files are ignored by Git and recreated before development or production builds.

Run `npm test` for mobile and desktop browser checks. Tests use an installed Edge browser on Windows; elsewhere install Chromium with `npx playwright install chromium` first.

Vue generates the portfolio's static HTML at build time. Visitors receive a small gallery script instead of the Vue runtime. The native photo dialog traps focus, supports arrow/Home/End keys and touch controls, returns focus when closed, and releases the displayed image. Development serves the same rendered HTML and reloads when templates or portfolio data change.

Photos remain available through normal image links when JavaScript is disabled or native dialogs are unsupported, with native lazy loading and responsive AVIF/WebP sources. Fonts are local: one Space Grotesk variable font and DM Mono. Regression checks enforce script and font size budgets as well as mobile/desktop usability.

The gallery includes intermediate 640px and 1280px candidates to avoid oversized downloads on high-density displays. Lazy thumbnails use automatic rendered-width sizing where supported, with explicit sizes for older browsers. Thumbnail and lightbox files share the browser cache; hover image effects run only on devices with a precise, hover-capable pointer.

SEO settings live in `src/site-config.js`. The build adds a canonical URL, search metadata, Open Graph and Twitter previews, artist/gallery JSON-LD, and a 1200x630 JPEG share image. `dist/sitemap.xml` lists the canonical portfolio URL and its published photos, and updates whenever the gallery changes.

Every production build validates the rendered HTML, indexing directives, canonical URL, structured data, crawlable photo/profile links, social preview, and image sitemap before GitHub Pages can publish it. These checks run only at build time and add no browser JavaScript.

For discovery, submit `https://teuncm.nl/dj/sitemap.xml` in Google Search Console, or add the following line to the existing **domain-root** `https://teuncm.nl/robots.txt`:

```text
Sitemap: https://teuncm.nl/dj/sitemap.xml
```

This repository deploys under `/dj/`, so it cannot manage the root website's robots file. A `/dj/robots.txt` file would not control crawling. See [Google's sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) and [robots.txt placement requirements](https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec).

The [live main-site audit and integration notes](docs/main-site-seo.md) record the verified SoundCloud URL and the remaining root-site changes. Portfolio structured data uses the existing homepage Person and WebSite identifiers; profile URLs and identity settings live in `src/site-config.js`.
