import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { copyFile, cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { imageSitemap, seoTags } from './scripts/seo.mjs'
import { site } from './src/site-config.js'

function portfolioAssets() {
  let config
  let devServer
  const manifest = () => readFile(resolve(config.root, 'src/generated/images.json'), 'utf8').then(JSON.parse)

  return {
    name: 'portfolio-assets',
    configResolved(resolved) { config = resolved },
    configureServer(server) { devServer = server },
    handleHotUpdate({ file, server }) {
      if (file.endsWith('.vue') || /[\\/]src[\\/](photos|site-config|images)\.js$/.test(file)) {
        server.ws.send({ type: 'full-reload' })
        return []
      }
    },
    async transformIndexHtml(html) {
      const images = await manifest()
      const preloads = [
        { image: images.hero.mobile, media: '(max-width: 760px)' },
        { image: images.photos[images.hero.file], media: '(min-width: 760.01px)' },
      ].map(({ image, media }) => ({
        tag: 'link',
        attrs: {
          rel: 'preload',
          as: 'image',
          type: 'image/avif',
          media,
          href: `${config.base}${(image.avif.find(({ width }) => width >= 768) ?? image.avif.at(-1)).file}`,
          imagesrcset: image.avif.map(({ file, width }) => `${config.base}${file} ${width}w`).join(', '),
          imagesizes: '100vw',
          fetchpriority: 'high',
        },
        injectTo: 'head',
      }))
      if (devServer) {
        const { render } = await devServer.ssrLoadModule('/src/entry-server.js')
        html = html.replace('<!--app-html-->', await render())
      }
      return { html, tags: [...preloads, ...seoTags(images)] }
    },
    async closeBundle() {
      if (config.command !== 'build') return
      const images = await manifest()
      const outDir = resolve(config.root, config.build.outDir)
      const publicDir = resolve(config.root, 'public')
      const variants = [...Object.values(images.photos), images.hero.mobile]
        .flatMap((image) => [...image.webp, ...image.avif])
      for (const { file } of variants) {
        const destination = join(outDir, file)
        await mkdir(dirname(destination), { recursive: true })
        await copyFile(join(publicDir, file), destination)
      }
      await copyFile(join(publicDir, images.hero.social.file), join(outDir, images.hero.social.file))
      await writeFile(join(outDir, 'sitemap.xml'), imageSitemap(images))
      // Publish site assets, but keep camera originals and stale derivatives local.
      for (const entry of await readdir(publicDir)) {
        if (entry !== 'optimized' && !/\.jpe?g$/i.test(entry)) {
          await cp(join(publicDir, entry), join(outDir, entry), { recursive: true })
        }
      }
    },
  }
}

export default defineConfig({
  base: new URL(site.url).pathname,
  plugins: [vue(), portfolioAssets()],
  build: { copyPublicDir: false },
})
