import { createHash } from 'node:crypto'
import { access, mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises'
import { join, parse } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { heroFile, imageWidths } from '../src/image-config.js'

const publicDir = fileURLToPath(new URL('../public/', import.meta.url))
const outputDir = join(publicDir, 'optimized')
const generatedDir = fileURLToPath(new URL('../src/generated/', import.meta.url))
const recipe = { widths: imageWidths, webp: 76, avif: 48, version: 1, sharp: sharp.versions }
let generated = 0
let reused = 0

await mkdir(outputDir, { recursive: true })
await mkdir(generatedDir, { recursive: true })

async function exists(path) {
  try {
    await access(path)
    return true
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    return false
  }
}

async function optimize(file, mobile = false) {
  const input = await readFile(join(publicDir, file))
  const metadata = await sharp(input).metadata()
  const rotated = metadata.orientation >= 5 && metadata.orientation <= 8
  const width = rotated ? metadata.height : metadata.width
  const height = rotated ? metadata.width : metadata.height
  const maxWidth = mobile ? Math.min(width, Math.floor(height * 2 / 3), 1024) : width
  const widths = [...new Set(imageWidths.map((size) => Math.min(size, maxWidth)))]
  const hash = createHash('sha256').update(input).update(JSON.stringify({ ...recipe, mobile })).digest('hex').slice(0, 12)
  const name = `${parse(file).name}${mobile ? '-mobile' : ''}-${hash}`
  const result = { width: mobile ? maxWidth : width, height: mobile ? Math.round(maxWidth * 3 / 2) : height }

  for (const format of ['webp', 'avif']) {
    result[format] = []
    for (const size of widths) {
      const filename = `${name}-${size}.${format}`
      const output = join(outputDir, filename)
      if (await exists(output)) {
        reused++
      } else {
        const image = sharp(input).rotate().resize({
          width: size,
          height: mobile ? Math.round(size * 3 / 2) : undefined,
          fit: 'cover',
          withoutEnlargement: true,
        })
        if (format === 'avif') image.avif({ quality: recipe.avif, effort: 4 })
        else image.webp({ quality: size >= 1600 ? 82 : recipe.webp, effort: 5 })
        await image.toFile(`${output}.tmp`)
        await rename(`${output}.tmp`, output)
        generated++
      }
      result[format].push({ file: `optimized/${filename}`, width: size })
    }
  }
  return result
}

const files = (await readdir(publicDir)).filter((file) => /\.jpe?g$/i.test(file)).sort()
const manifest = { photos: {}, hero: { file: heroFile } }
// Limit encoding to one source at a time to keep build memory bounded.
for (const file of files) manifest.photos[file] = await optimize(file)
manifest.hero.mobile = await optimize(heroFile, true)

const socialInput = await readFile(join(publicDir, heroFile))
const socialRecipe = { width: 1200, height: 630, quality: 85, version: 1 }
const socialHash = createHash('sha256').update(socialInput).update(JSON.stringify(socialRecipe)).digest('hex').slice(0, 12)
const socialName = `${parse(heroFile).name}-social-${socialHash}-1200.jpg`
const socialOutput = join(outputDir, socialName)
if (!(await exists(socialOutput))) {
  await sharp(socialInput).rotate().resize(1200, 630, { fit: 'cover' })
    .jpeg({ quality: socialRecipe.quality, mozjpeg: true }).toFile(`${socialOutput}.tmp`)
  await rename(`${socialOutput}.tmp`, socialOutput)
  generated++
} else reused++
manifest.hero.social = { file: `optimized/${socialName}`, width: 1200, height: 630 }

const output = join(generatedDir, 'images.json')
const json = `${JSON.stringify(manifest, null, 2)}\n`
if (!(await exists(output)) || await readFile(output, 'utf8') !== json) await writeFile(output, json)
console.log(`${files.length} photos: generated ${generated}, reused ${reused} optimized images.`)
