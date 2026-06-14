<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const asset = (filename) => `${import.meta.env.BASE_URL}${filename}`
const optimized = (filename, width) => asset(`optimized/${filename.replace(/\.[^.]+$/, '')}-${width}.webp`)
const srcset = (filename) => [480, 960, 1600].map((width) => `${optimized(filename, width)} ${width}w`).join(', ')
const imageSizes = (photo) => photo.size === 'wide'
  ? '(max-width: 760px) 100vw, 67vw'
  : '(max-width: 760px) 100vw, 34vw'

const photos = [
  { file: 'DSC07707.jpg', alt: 'DJ performing with both hands raised', size: 'wide' },
  { file: 'DSC05466.jpg', alt: 'Black and white portrait of DJ mixing at the decks', size: 'tall' },
  { file: 'DSC08293.jpg', alt: 'Close portrait of DJ wearing headphones', size: 'tall' },
  { file: 'DSC05404.jpg', alt: 'DJ mixing between dancers under red and blue club lights', size: 'standard' },
  { file: 'dj2.jpg', alt: 'DJ performing to an outdoor festival crowd beneath colorful balloons', size: 'wide' },
  { file: 'flagshipfeest090920250048.jpg', alt: 'DJ performing aboard Flagship Amsterdam', size: 'wide' },
  { file: 'DSC05162.jpg', alt: 'DJ performing on an outdoor stage', size: 'tall' },
  { file: 'DSC05202.jpg', alt: 'Close-up of DJ focused on an outdoor set', size: 'wide' },
  { file: '5870564160528125274.jpg', alt: 'DJ performing in a crowded venue', size: 'standard' },
  { file: 'oerknal.jpeg', alt: 'DJ set under colorful club lights', size: 'standard' },
  { file: 'DSC07650.jpg', alt: 'DJ smiling and raising one hand at Panama', size: 'tall' },
  { file: 'DSC_0319.jpg', alt: 'DJ smiling and pointing during a live set', size: 'wide' },
  { file: 'IMG_20220603_175713.jpg', alt: 'Portrait during a live DJ set', size: 'tall' },
  { file: '52084128322_1271c170c3_k.jpg', alt: 'DJ performing beneath a festival tent', size: 'tall' },
  { file: 'DSC07696.jpg', alt: 'DJ performing behind the booth at Panama', size: 'tall' },
  { file: 'SK_8507.JPG', alt: 'DJ facing the crowd during a club set', size: 'wide' },
  { file: 'skoll.jpeg', alt: 'DJ performing for a festival crowd', size: 'wide' },
  { file: '5870564160528125276.jpg', alt: 'Crowd enjoying a live DJ set', size: 'standard' },
]

const activePhoto = ref(null)

function openPhoto(photo) {
  activePhoto.value = photo
  document.body.classList.add('lightbox-open')
}

function closePhoto() {
  activePhoto.value = null
  document.body.classList.remove('lightbox-open')
}

function handleKeydown(event) {
  if (event.key === 'Escape') closePhoto()
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  document.body.classList.remove('lightbox-open')
})
</script>

<template>
  <main>
    <header class="site-header">
      <a class="wordmark" href="#top" aria-label="tune:m — back to top">tune:m</a>
      <nav aria-label="Main navigation">
        <a href="#showcase">Showcase</a>
        <a href="#about">About</a>
        <a href="https://www.instagram.com/dj_tune_m/" target="_blank" rel="noopener noreferrer">Book ↗</a>
      </nav>
    </header>

    <section id="top" class="hero">
      <img
        :src="optimized('flagshipfeest090920250048.jpg', 960)"
        :srcset="srcset('flagshipfeest090920250048.jpg')"
        sizes="100vw"
        fetchpriority="high"
        alt=""
      />
      <div class="hero-shade"></div>
      <div class="hero-copy">
        <p class="eyebrow"><span></span> Live energy</p>
        <p class="hero-intro">A collection of high energy and vibes behind the decks.</p>
      </div>
      <a class="scroll-cue" href="#showcase"><span>Explore the sets</span><span class="arrow">↓</span></a>
      <p class="hero-index">01 / 18</p>
    </section>

    <section id="showcase" class="showcase">
      <div class="section-heading">
        <div>
          <p class="eyebrow"><span></span> Selected moments</p>
          <h2>Behind<br />the decks</h2>
        </div>
      </div>

      <div class="gallery">
        <button
          v-for="(photo, index) in photos"
          :key="photo.file"
          class="gallery-item"
          :class="photo.size"
          type="button"
          :aria-label="`Open image ${index + 1}: ${photo.alt}`"
          @click="openPhoto(photo)"
        >
          <img
            :src="optimized(photo.file, 960)"
            :srcset="srcset(photo.file)"
            :sizes="imageSizes(photo)"
            :alt="photo.alt"
            loading="lazy"
            decoding="async"
          />
          <span class="photo-number">{{ String(index + 1).padStart(2, '0') }}</span>
          <span class="view-label">View</span>
        </button>
      </div>
    </section>

    <section id="about" class="about">
      <a class="booking-link" href="https://www.instagram.com/dj_tune_m/" target="_blank" rel="noopener noreferrer">
        <span>Instagram</span>
        <strong>@dj_tune_m ↗</strong>
      </a>
      <a class="back-to-top" href="#top">Back to top <span>↑</span></a>
    </section>

    <footer><span>tune:m</span><a href="https://www.instagram.com/dj_tune_m/" target="_blank" rel="noopener noreferrer">@dj_tune_m ↗</a></footer>

    <Transition name="fade">
      <div v-if="activePhoto" class="lightbox" role="dialog" aria-modal="true" @click="closePhoto">
        <button type="button" aria-label="Close image" @click="closePhoto">Close ×</button>
        <img :src="optimized(activePhoto.file, 1600)" :alt="activePhoto.alt" @click.stop />
      </div>
    </Transition>
  </main>
</template>
