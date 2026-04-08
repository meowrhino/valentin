/* ============================================
   Home — horizontal strip with mirilla
   Infinite loop via clone technique
   ============================================ */

const Home = {

  strip: null,
  slides: [],        // all slides including clones
  realSlides: [],    // only real slides
  slideMap: [],      // maps slide index → { projectIndex, photoNum } (includes clones)
  realSlideMap: [],  // only real entries
  currentSlide: 0,
  realCount: 0,
  touchStartX: 0,
  touchStartY: 0,
  scrollLocked: false,
  wheelAccum: 0,
  wheelTimer: null,
  _jumping: false,   // true during instant clone→real jump

  init(projects) {
    this.strip = document.getElementById('strip');
    this.strip.innerHTML = '';
    this.realSlides = [];
    this.realSlideMap = [];
    this.currentSlide = 0;

    // Build real slides from fotosHome of each project
    projects.forEach((project, pIdx) => {
      project.fotosHome.forEach(num => {
        const slide = this._createSlide(project, pIdx, num);
        this.realSlides.push(slide);
        this.realSlideMap.push({ projectIndex: pIdx, photoNum: num });
      });
    });

    this.realCount = this.realSlides.length;

    // Build strip with clones for infinite loop
    this._buildStripWithClones();

    // Start at first real slide (index 1, after the prepended clone)
    this.currentSlide = 1;

    // Load initial window of images
    Utils.lazyWindow(this.slides, this.currentSlide, LAZY_RADIUS);

    // Update footer with first project
    this._updateFooterProject();

    // Resize handler
    this._onResize = Utils.debounce(() => this._resizeAll(), 150);
    window.addEventListener('resize', this._onResize);

    // Listen for transition end to handle clone→real jumps
    this.strip.addEventListener('transitionend', () => this._onTransitionEnd());

    this._bindScroll();
    this._goTo(this.currentSlide, false);
  },

  _createSlide(project, pIdx, num) {
    const slide = document.createElement('div');
    slide.className = 'slide';
    slide.dataset.project = project.slug;
    slide.dataset.projectIndex = pIdx;
    slide.dataset.photoNum = num;

    const img = document.createElement('img');
    img.dataset.src = Utils.imgPath(project.slug, num, project.imgExt);
    img.alt = project.nombre;

    img.addEventListener('load', () => {
      Utils.sizeImage(img, slide);
    });

    slide.appendChild(img);
    return slide;
  },

  _cloneSlide(slide, mapEntry) {
    const clone = slide.cloneNode(true);
    clone.classList.add('slide--clone');
    // Re-attach load listener for the cloned img
    const img = clone.querySelector('img');
    if (img) {
      img.addEventListener('load', () => {
        Utils.sizeImage(img, clone);
      });
    }
    return clone;
  },

  _buildStripWithClones() {
    this.slides = [];
    this.slideMap = [];
    this.strip.innerHTML = '';

    if (this.realCount === 0) return;

    // Clone of last real slide → prepend
    const lastIdx = this.realCount - 1;
    const cloneLast = this._cloneSlide(this.realSlides[lastIdx]);
    this.slides.push(cloneLast);
    this.slideMap.push({ ...this.realSlideMap[lastIdx] });
    this.strip.appendChild(cloneLast);

    // Real slides
    this.realSlides.forEach((slide, i) => {
      this.slides.push(slide);
      this.slideMap.push({ ...this.realSlideMap[i] });
      this.strip.appendChild(slide);
    });

    // Clone of first real slide → append
    const cloneFirst = this._cloneSlide(this.realSlides[0]);
    this.slides.push(cloneFirst);
    this.slideMap.push({ ...this.realSlideMap[0] });
    this.strip.appendChild(cloneFirst);
  },

  _bindScroll() {
    const viewer = document.getElementById('viewer');

    // Shared wheel + touch handling
    Utils.bindHorizontalScroll(viewer, this, {
      next: () => this.next(),
      prev: () => this.prev(),
      isActive: () => App.state.view === 'home'
    });

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
    // Always advance one position (even into clone territory)
    this._goTo(this.currentSlide + 1);
  },

  prev() {
    // Always go back one position (even into clone territory)
    this._goTo(this.currentSlide - 1);
  },

  _onTransitionEnd() {
    if (this._jumping) return;

    // If we animated to the clone of the first slide (index realCount + 1),
    // jump instantly to the real first slide (index 1)
    if (this.currentSlide >= this.realCount + 1) {
      this._jumping = true;
      this.currentSlide = 1;
      this.strip.style.transition = 'none';
      this.strip.style.transform = `translateX(${-this.currentSlide * 100}%)`;
      // Force reflow then re-enable transitions
      this.strip.offsetHeight;
      this._jumping = false;
      Utils.lazyWindow(this.slides, this.currentSlide, LAZY_RADIUS);
      this._updateFooterProject();
    }
    // If we animated to the clone of the last slide (index 0),
    // jump instantly to the real last slide (index realCount)
    else if (this.currentSlide <= 0) {
      this._jumping = true;
      this.currentSlide = this.realCount;
      this.strip.style.transition = 'none';
      this.strip.style.transform = `translateX(${-this.currentSlide * 100}%)`;
      this.strip.offsetHeight;
      this._jumping = false;
      Utils.lazyWindow(this.slides, this.currentSlide, LAZY_RADIUS);
      this._updateFooterProject();
    }
  },

  _goTo(index, animate) {
    if (animate === undefined) animate = true;
    this.currentSlide = index;
    const offset = -index * 100;
    this.strip.style.transition = animate ? SLIDE_TRANSITION : 'none';
    this.strip.style.transform = `translateX(${offset}%)`;

    // Lock scroll during animation
    if (animate) {
      this.scrollLocked = true;
      setTimeout(() => { this.scrollLocked = false; }, SCROLL_LOCK_MS);
    }

    // Lazy load window
    Utils.lazyWindow(this.slides, index, LAZY_RADIUS);

    // Update footer
    this._updateFooterProject();
  },

  _updateFooterProject() {
    const map = this.slideMap[this.currentSlide];
    if (map) {
      const project = App.state.projects[map.projectIndex];
      Footer.setHomeName(project.nombre);
      Footer.setLenguetaProject(project);
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

  // Get current slide index (in real-slide terms, 0-based)
  getPosition() {
    // Convert from clone-aware index to real index
    return this.currentSlide - 1;
  },

  // Restore position when coming back from project (real index, 0-based)
  setPosition(index) {
    // Convert from real index to clone-aware index
    this._goTo(index + 1, false);
  },

  show() {
    // Re-build strip with clones
    this._buildStripWithClones();
    this.strip.style.display = 'flex';
    this._goTo(this.currentSlide, false);
  },

  hide() {
    // Detach all slides (including clones) but keep real references
    this.slides.forEach(slide => slide.remove());
  }
};
