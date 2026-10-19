import { build, preview } from 'vite'
import { prerender } from '../scripts/prerender.mjs'

export default async function setup() {
  await import('../scripts/optimize-images.mjs')
  await build({ logLevel: 'warn' })
  await prerender()
  const server = await preview({ preview: { host: '127.0.0.1', port: 4173, strictPort: true } })
  return () => new Promise((resolve, reject) => {
    server.httpServer.close((error) => error ? reject(error) : resolve())
  })
}
