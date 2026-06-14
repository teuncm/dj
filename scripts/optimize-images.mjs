import { mkdir, readdir } from 'node:fs/promises'
import { extname, join, parse } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const publicDir = fileURLToPath(new URL('../public/', import.meta.url))
const outputDir = fileURLToPath(new URL('../public/optimized/', import.meta.url))
const widths = [480, 960, 1600]
const supportedExtensions = new Set(['.jpg', '.jpeg'])

await mkdir(outputDir, { recursive: true })

const files = (await readdir(publicDir))
  .filter((file) => supportedExtensions.has(extname(file).toLowerCase()))

await Promise.all(
  files.flatMap((file) => {
    const name = parse(file).name

    return widths.map((width) =>
      sharp(join(publicDir, file))
        .rotate()
        .resize({ width })
        .webp({ quality: width === 1600 ? 82 : 76, effort: 5 })
        .toFile(join(outputDir, `${name}-${width}.webp`)),
    )
  }),
)

console.log(`Optimized ${files.length} photos at ${widths.join(', ')}px.`)
