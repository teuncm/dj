import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { validateSeoBuild } from './validate-seo.mjs'

export async function prerender() {
  const server = await createServer({
    server: { middlewareMode: true, watch: null },
    appType: 'custom',
  })
  try {
    const { render } = await server.ssrLoadModule('/src/entry-server.js')
    const output = resolve(server.config.root, server.config.build.outDir, 'index.html')
    const template = await readFile(output, 'utf8')
    const marker = '<!--app-html-->'
    if (!template.includes(marker)) throw new Error('Build HTML is missing the prerender marker.')
    await writeFile(output, template.replace(marker, await render()))
    await validateSeoBuild(resolve(output, '..'))
    console.log('Pre-rendered the portfolio into static HTML.')
  } finally {
    await server.close()
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await prerender()
