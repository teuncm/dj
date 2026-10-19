# Main-Site SEO Integration

Live audit on 2026-10-19 confirmed that the homepage and DJ portfolio return HTTP 200, their canonicals are correct, and the legacy `https://teuncm.github.io/dj/` URL redirects to `https://teuncm.nl/dj/`. The published SoundCloud profile is `https://soundcloud.com/tune_m` and also returns HTTP 200.

The live portfolio rendered on a mobile viewport without runtime or hydration errors or horizontal overflow. All 27 checked image, script, stylesheet, favicon, and social-preview URLs returned HTTP 200.

The updated portfolio build shares the homepage's existing `https://teuncm.nl/#person` and `https://teuncm.nl/#website` identifiers. It uses Teun Mathijssen as the person's name and Tune:M as an alternate name, and links the gallery to the main website.

The audit also found that generated metadata pushed the charset declaration almost 15 KB into the published HTML. The updated build keeps that declaration within the first 1024 bytes, enforced by a regression check. These local improvements still require deployment to appear on the live site.

The following remaining changes belong to the main-site repository, not this `/dj/` deployment.

## Sitemap Discovery

The live root sitemap currently lists only `/` and `/signal-processing/`. Add the portfolio entry to that sitemap:

```xml
<url>
  <loc>https://teuncm.nl/dj/</loc>
</url>
```

The root `robots.txt` currently advertises only `https://teuncm.nl/sitemap.xml`. Keep that line and add the DJ image sitemap:

```text
Sitemap: https://teuncm.nl/dj/sitemap.xml
```

This allows the existing root sitemap to remain a URL set; no sitemap-index migration is needed. Do not add a `/dj/robots.txt`, since crawler rules are read at the domain root.

## Links and Identity

In the homepage's visible DJ showcase link and Person `sameAs` list, replace `https://teuncm.github.io/dj/` with the canonical `https://teuncm.nl/dj/` to avoid the extra redirect.

Add `Tune:M` to the homepage Person's `alternateName` list, preserving the existing aliases:

```json
"alternateName": ["Tune:M", "Teun M.", "Teun M", "teuncm"]
```

Keep the existing `#person`, `#website`, and `#profile` identifiers unchanged. This matches the portfolio's structured data without creating a second artist identity.

After deploying these changes, the root and DJ sitemaps can be submitted through the existing Search Console property. Account verification and submission are outside this repository.
