/* ============================================
   Utils — helpers, lazy loading, image sizing
   ============================================ */

// --- Shared constants ---
const SCROLL_LOCK_MS = 700;
const WHEEL_THRESHOLD = 120;
const WHEEL_RESET_MS = 120;
const TOUCH_MIN_SWIPE = 40;
const LAZY_RADIUS = 3;
const SLIDE_TRANSITION = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';

const Utils = {

  // Build image path for a project
  imgPath(slug, num, ext) {
    return `_PROJECTS/${slug}/${num}.${ext || 'webp'}`;
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
  },

  // Bind horizontal scroll (wheel + touch) to an element
  // ctx must have: scrollLocked, wheelAccum, wheelTimer, touchStartX, touchStartY
  // callbacks: { next, prev, isActive }
  bindHorizontalScroll(element, ctx, callbacks) {
    element.addEventListener('wheel', (e) => {
      if (!callbacks.isActive()) return;
      e.preventDefault();
      if (ctx.scrollLocked) return;

      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const isTrackpad = Math.abs(e.deltaY) < 50 && e.deltaMode === 0 && !Number.isInteger(e.deltaY);

      if (!isTrackpad) {
        ctx.scrollLocked = true;
        setTimeout(() => { ctx.scrollLocked = false; }, SCROLL_LOCK_MS);
        if (delta > 0) callbacks.next();
        else if (delta < 0) callbacks.prev();
        return;
      }

      ctx.wheelAccum += delta;
      clearTimeout(ctx.wheelTimer);
      ctx.wheelTimer = setTimeout(() => { ctx.wheelAccum = 0; }, WHEEL_RESET_MS);

      if (ctx.wheelAccum > WHEEL_THRESHOLD) {
        ctx.wheelAccum = 0;
        callbacks.next();
      } else if (ctx.wheelAccum < -WHEEL_THRESHOLD) {
        ctx.wheelAccum = 0;
        callbacks.prev();
      }
    }, { passive: false });

    element.addEventListener('touchstart', (e) => {
      if (!callbacks.isActive()) return;
      ctx.touchStartX = e.touches[0].clientX;
      ctx.touchStartY = e.touches[0].clientY;
    }, { passive: true });

    element.addEventListener('touchend', (e) => {
      if (!callbacks.isActive()) return;
      const dx = e.changedTouches[0].clientX - ctx.touchStartX;
      const dy = e.changedTouches[0].clientY - ctx.touchStartY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > TOUCH_MIN_SWIPE) {
        if (dx < 0) callbacks.next();
        else callbacks.prev();
      }
    }, { passive: true });
  }
};
