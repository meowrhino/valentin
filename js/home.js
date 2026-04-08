/* ============================================
   Home — horizontal strip with mirilla
   ============================================ */

const Home = {

  strip: null,
  slides: [],
  slideMap: [],      // maps slide index → { projectIndex, photoNum }
  currentSlide: 0,
  touchStartX: 0,
  touchStartY: 0,
  scrollLocked: false,
  wheelAccum: 0,
  wheelTimer: null,

  init(projects) {
    this.strip = document.getElementById('strip');
    this.strip.innerHTML = '';
    this.slides = [];
    this.slideMap = [];
    this.currentSlide = 0;

    // Build slides from fotosHome of each project
    projects.forEach((project, pIdx) => {
      project.fotosHome.forEach(num => {
        const slide = document.createElement('div');
        slide.className = 'slide';
        slide.dataset.project = project.slug;
        slide.dataset.projectIndex = pIdx;
        slide.dataset.photoNum = num;

        const img = document.createElement('img');
        img.dataset.src = Utils.imgPath(project.slug, num);
        img.alt = project.nombre;

        img.addEventListener('load', () => {
          Utils.sizeImage(img, slide);
        });

        slide.appendChild(img);
        this.strip.appendChild(slide);
        this.slides.push(slide);
        this.slideMap.push({ projectIndex: pIdx, photoNum: num });
      });
    });

    // Load initial window of images
    Utils.lazyWindow(this.slides, 0, 3);

    // Update footer with first project
    this._updateFooterProject();

    // Resize handler
    this._onResize = Utils.debounce(() => this._resizeAll(), 150);
    window.addEventListener('resize', this._onResize);

    this._bindScroll();
    this._goTo(0, false);
  },

  _bindScroll() {
    const viewer = document.getElementById('viewer');

    // Mouse wheel → horizontal scroll
    // Accumulates delta for trackpads (many small events) and discrete mice
    viewer.addEventListener('wheel', (e) => {
      if (App.state.view !== 'home') return;
      e.preventDefault();
      if (this.scrollLocked) return;

      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      this.wheelAccum += delta;

      clearTimeout(this.wheelTimer);
      this.wheelTimer = setTimeout(() => { this.wheelAccum = 0; }, 200);

      const threshold = 50;
      if (this.wheelAccum > threshold) {
        this.wheelAccum = 0;
        this.next();
      } else if (this.wheelAccum < -threshold) {
        this.wheelAccum = 0;
        this.prev();
      }
    }, { passive: false });

    // Touch support
    viewer.addEventListener('touchstart', (e) => {
      if (App.state.view !== 'home') return;
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
    }, { passive: true });

    viewer.addEventListener('touchend', (e) => {
      if (App.state.view !== 'home') return;
      const dx = e.changedTouches[0].clientX - this.touchStartX;
      const dy = e.changedTouches[0].clientY - this.touchStartY;
      // Only act on horizontal swipes
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
        if (dx < 0) this.next();
        else this.prev();
      }
    }, { passive: true });

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (App.state.view !== 'home') return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') this.next();
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') this.prev();
    });

    // Click on slide → enter project
    this.strip.addEventListener('click', (e) => {
      if (App.state.view !== 'home') return;
      const slide = e.target.closest('.slide');
      if (!slide) return;
      const pIdx = parseInt(slide.dataset.projectIndex);
      const photoNum = parseInt(slide.dataset.photoNum);
      App.enterProject(pIdx, photoNum);
    });
  },

  next() {
    if (this.currentSlide < this.slides.length - 1) {
      this._goTo(this.currentSlide + 1);
    }
  },

  prev() {
    if (this.currentSlide > 0) {
      this._goTo(this.currentSlide - 1);
    }
  },

  _goTo(index, animate) {
    if (animate === undefined) animate = true;
    this.currentSlide = index;
    const offset = -index * 100;
    this.strip.style.transition = animate ? 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)' : 'none';
    this.strip.style.transform = `translateX(${offset}%)`;

    // Lock scroll during animation
    if (animate) {
      this.scrollLocked = true;
      setTimeout(() => { this.scrollLocked = false; }, 450);
    }

    // Lazy load window
    Utils.lazyWindow(this.slides, index, 3);

    // Update footer
    this._updateFooterProject();
  },

  _updateFooterProject() {
    const map = this.slideMap[this.currentSlide];
    if (map) {
      const project = App.state.projects[map.projectIndex];
      Footer.setHomeName(project.nombre);
    }
  },

  _resizeAll() {
    this.slides.forEach(slide => {
      const img = slide.querySelector('img');
      if (img && img.naturalWidth) {
        Utils.sizeImage(img, slide);
      }
    });
  },

  // Get current slide index for restoring position
  getPosition() {
    return this.currentSlide;
  },

  // Restore position when coming back from project
  setPosition(index) {
    this._goTo(index, false);
  },

  show() {
    // Re-insert slides into the strip (Project.close() cleared it)
    this.strip.innerHTML = '';
    this.slides.forEach(slide => this.strip.appendChild(slide));
    this.strip.style.display = 'flex';
    this._goTo(this.currentSlide, false);
  },

  hide() {
    // Detach slides but keep references
    this.slides.forEach(slide => slide.remove());
  }
};
