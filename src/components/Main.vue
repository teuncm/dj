<script setup>
import { images, hero, imageSrc, imageSrcset, gallerySizes } from '../images.js'
import { photos as portfolioPhotos } from '../photos.js'
import { site } from '../site-config.js'

const photos = portfolioPhotos.map((photo) => ({ ...photo, image: images[photo.file] }))

</script>

<template>
  <main>
    <a class="skip-link" href="#showcase">Skip to photos</a>
    <header class="site-header">
      <h1 class="wordmark"><a href="#top" aria-label="Tune:M DJ portfolio, back to top">Tune:M</a></h1>
      <nav aria-label="Main navigation">
        <a href="#showcase">Photos</a>
        <a :href="site.soundcloud" target="_blank" rel="me noopener noreferrer">SoundCloud ↗</a>
        <a :href="site.instagram" target="_blank" rel="noopener noreferrer">Book ↗</a>
      </nav>
    </header>

    <section id="top" class="hero">
      <picture>
        <source media="(max-width: 760px)" type="image/avif" :srcset="imageSrcset(hero.mobile, 'avif')" sizes="100vw" />
        <source media="(max-width: 760px)" type="image/webp" :srcset="imageSrcset(hero.mobile, 'webp')" sizes="100vw" />
        <source type="image/avif" :srcset="imageSrcset(hero.desktop, 'avif')" sizes="100vw" />
        <img
          :src="imageSrc(hero.desktop)"
          :srcset="imageSrcset(hero.desktop, 'webp')"
          sizes="100vw"
          :width="hero.desktop.width"
          :height="hero.desktop.height"
          fetchpriority="high"
          loading="eager"
          alt="Tune:M mixing at Flagchella with dancers behind the booth"
        />
      </picture>
      <div class="hero-shade"></div>
      <a class="scroll-cue" href="#showcase"><span>Photos</span><span class="arrow">↓</span></a>
      <p class="hero-index">01 / {{ photos.length }}</p>
    </section>

    <section id="showcase" class="showcase">
      <div class="section-heading">
        <nav class="breadcrumbs" aria-label="Breadcrumb">
          <a :href="site.home">teuncm.nl</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Tune:M</span>
        </nav>
        <h2>Photos</h2>
      </div>

      <div class="gallery">
        <a
          v-for="(photo, index) in photos"
          :key="photo.file"
          class="gallery-item"
          :class="photo.size"
          :data-photo="photo.file"
          :href="imageSrc(photo.image, 'webp', true)"
          :aria-label="`Open image ${index + 1}: ${photo.alt}`"
        >
          <picture>
            <source type="image/avif" :srcset="imageSrcset(photo.image, 'avif')" :sizes="gallerySizes(photo)" />
            <img
              :src="imageSrc(photo.image)"
              :srcset="imageSrcset(photo.image, 'webp')"
              :sizes="gallerySizes(photo)"
              :width="photo.image.width"
              :height="photo.image.height"
              :alt="photo.alt"
              loading="lazy"
              decoding="async"
              fetchpriority="low"
            />
          </picture>
          <span class="photo-number">{{ String(index + 1).padStart(2, '0') }}</span>
          <span class="view-label">View</span>
        </a>
      </div>
    </section>

    <section id="instagram" class="about">
      <a class="booking-link" :href="site.instagram" target="_blank" rel="me noopener noreferrer">
        <span>Instagram</span>
        <strong>@dj_tune_m ↗</strong>
      </a>
      <a class="booking-link" :href="site.soundcloud" target="_blank" rel="me noopener noreferrer">
        <span>SoundCloud</span>
        <strong>tune_m ↗</strong>
      </a>
      <a class="booking-link" :href="site.home" rel="me">
        <span>Website</span>
        <strong>teuncm.nl ↗</strong>
      </a>
      <a class="back-to-top" href="#top">Back to top <span>↑</span></a>
    </section>

    <footer>
      <span>Tune:M</span>
      <a :href="site.home" rel="me">teuncm.nl</a>
      <a :href="site.soundcloud" target="_blank" rel="me noopener noreferrer">SoundCloud ↗</a>
      <a :href="site.instagram" target="_blank" rel="noopener noreferrer">@dj_tune_m ↗</a>
    </footer>

    <dialog class="lightbox" aria-label="Photo viewer">
      <button class="lightbox-close" type="button" data-action="close" aria-label="Close image" autofocus>Close ×</button>
      <div class="lightbox-image"></div>
      <div class="lightbox-controls">
        <button type="button" data-action="previous" aria-label="Previous photo">←</button>
        <span class="lightbox-position" role="status" aria-live="polite"></span>
        <button type="button" data-action="next" aria-label="Next photo">→</button>
      </div>
    </dialog>
  </main>
</template>
