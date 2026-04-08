/* ============================================
   Utils — helpers, lazy loading, image sizing
   ============================================ */

const Utils = {

  // Build image path for a project
  imgPath(slug, num) {
    return `/_PROJECTS/${slug}/${num}.webp`;
  },

  // Detect if image is "more horizontal" than the container
  isLandscape(img, container) {
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const containerRatio = container.offsetWidth / container.offsetHeight;
    return imgRatio > containerRatio;
  },

  // Size an image to fill the container (cover behavior via JS for drag-to-pan support)
  sizeImage(img, container) {
    const cw = container.offsetWidth;
    const ch = container.offsetHeight;

    if (Utils.isLandscape(img, container)) {
      // Image is wider than container ratio — fill height, overflow width
      img.style.height = ch + 'px';
      img.style.width = 'auto';
    } else {
      // Image is taller than container ratio — fill width, overflow height
      img.style.width = cw + 'px';
      img.style.height = 'auto';
    }
  },

  // Intelligent lazy loading — sliding window around current index
  // Keeps ±radius images loaded, unloads the rest
  // Like a spotlight that follows the user through the strip
  lazyWindow(slides, currentIndex, radius) {
    radius = radius || 3;
    const len = slides.length;

    for (let i = 0; i < len; i++) {
      const img = slides[i].querySelector('img');
      if (!img || !img.dataset.src) continue;

      const distance = Math.abs(i - currentIndex);

      if (distance <= radius) {
        // Load: set src if not already loaded
        if (!img.getAttribute('src')) {
          img.src = img.dataset.src;
        }
      } else if (distance > radius + 2) {
        // Unload: remove src to free memory (keep buffer of +2 before unloading)
        if (img.getAttribute('src')) {
          img.removeAttribute('src');
        }
      }
    }
  },

  // Shuffle array (Fisher-Yates) — used for 8x8 grid transition
  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  // Generate array [0, 1, 2, ..., n-1]
  range(n) {
    return Array.from({ length: n }, (_, i) => i);
  },

  // Debounce
  debounce(fn, ms) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  },

  // Format seconds to m:ss
  formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return m + ':' + String(sec).padStart(2, '0');
  }
};
