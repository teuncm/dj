import manifest from './generated/images.json'

const asset = (file) => `${import.meta.env.BASE_URL}${file}`

export const images = manifest.photos
export const hero = {
  desktop: images[manifest.hero.file],
  mobile: manifest.hero.mobile,
}

export function imageSrc(image, format = 'webp', largest = false) {
  const variants = image[format]
  return asset((largest ? variants.at(-1) : variants.find(({ width }) => width >= 768) ?? variants.at(-1)).file)
}

export function imageSrcset(image, format) {
  return image[format].map(({ file, width }) => `${asset(file)} ${width}w`).join(', ')
}

export function gallerySizes(photo) {
  return photo.size === 'wide'
    ? 'auto, (max-width: 760px) calc(100vw - 24px), calc((188vw - 16px) / 3)'
    : 'auto, (max-width: 760px) calc(100vw - 24px), calc((94vw - 32px) / 3)'
}
