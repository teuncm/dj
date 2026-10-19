export function setupGallery() {
  const gallery = document.querySelector('.gallery')
  const dialog = document.querySelector('.lightbox')
  if (!gallery || typeof dialog?.showModal !== 'function') return

  const links = [...gallery.querySelectorAll('.gallery-item')]
  const holder = dialog.querySelector('.lightbox-image')
  const position = dialog.querySelector('.lightbox-position')
  const controls = [...dialog.querySelectorAll('button')]
  let index = 0
  let opener

  function showPhoto(next) {
    index = (next + links.length) % links.length
    const original = links[index].querySelector('img')
    const width = Number(original.getAttribute('width'))
    const height = Number(original.getAttribute('height'))
    const sizes = `min(90vw, ${80 * width / height}vh)`
    const picture = document.createElement('picture')
    for (const source of links[index].querySelectorAll('source')) {
      const copy = source.cloneNode()
      copy.sizes = sizes
      picture.append(copy)
    }
    const image = document.createElement('img')
    image.alt = original.alt
    image.width = width
    image.height = height
    image.sizes = sizes
    image.decoding = 'async'
    image.fetchPriority = 'high'
    picture.append(image)
    // Attach sources before assigning src so the browser selects one responsive file.
    holder.replaceChildren(picture)
    image.srcset = original.srcset
    image.src = original.src
    position.textContent = `Photo ${index + 1} of ${links.length}`
  }

  gallery.addEventListener('click', (event) => {
    const link = event.target.closest('.gallery-item')
    if (!link || !gallery.contains(link) || event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    opener = link
    showPhoto(links.indexOf(link))
    dialog.showModal()
    document.body.classList.add('lightbox-open')
  })

  dialog.addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action
    if (event.target === dialog || action === 'close') dialog.close()
    else if (action === 'previous') showPhoto(index - 1)
    else if (action === 'next') showPhoto(index + 1)
  })

  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
      const first = controls[0]
      const last = controls.at(-1)
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
      return
    }
    const target = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: links.length - 1 }[event.key]
    if (target === undefined) return
    event.preventDefault()
    showPhoto(target)
  })

  dialog.addEventListener('close', () => {
    document.body.classList.remove('lightbox-open')
    holder.replaceChildren()
    opener?.focus({ preventScroll: true })
  })
}
