/* ============================================
   Project — horizontal strip, full archive
   ============================================ */

const Project = {

  strip: null,
  slides: [],
  currentSlide: 0,
  projectData: null,
  touchStartX: 0,
  scrollLocked: false,
  wheelAccum: 0,
  wheelTimer: null,

  open(project, startPhotoNum) {
    this.projectData = project;
    this.slides = [];
    this.currentSlide = 0;

    // Create a separate strip for project view
    this.strip = document.getElementById('strip');
    this.strip.innerHTML = '';

    // Build slides
    if (project.contenido && project.contenido.length > 0) {
      this._buildFromContenido(project);
    } else {
      this._buildFromArchive(project);
    }

    // Find the starting slide (the photo that was clicked in home)
    if (startPhotoNum) {
      const idx = this.slides.findIndex(s => parseInt(s.dataset.photoNum) === startPhotoNum);
      if (idx >= 0) this.currentSlide = idx;
    }

    // Load images and go to start
    Utils.lazyWindow(this.slides, this.currentSlide, 3);
    this._goTo(this.currentSlide, false);

    // Update footer
    Footer.showProject(project.nombre);
  },

  _buildFromArchive(project) {
    for (let i = 1; i <= project.imgCountArchive; i++) {
      this._addImageSlide(project.slug, i);
    }
  },

  _buildFromContenido(project) {
    project.contenido.forEach(item => {
      if (item.tipo === 'imagen') {
        this._addImageSlide(project.slug, item.src);
      } else if (item.tipo === 'texto') {
        this._addTextSlide(item.contenido);
      } else if (item.tipo === 'audio') {
        this._addAudioSlide(`/_PROJECTS/${project.slug}/${item.src}`);
      }
    });
  },

  _addImageSlide(slug, num) {
    const slide = document.createElement('div');
    slide.className = 'slide';
    slide.dataset.photoNum = num;

    const img = document.createElement('img');
    img.dataset.src = Utils.imgPath(slug, num, this.projectData?.imgExt);
    img.alt = '';

    img.addEventListener('load', () => {
      Utils.sizeImage(img, slide);
    });

    slide.appendChild(img);
    this.strip.appendChild(slide);
    this.slides.push(slide);
  },

  _addTextSlide(text) {
    const slide = document.createElement('div');
    slide.className = 'slide slide--text';
    const p = document.createElement('p');
    p.textContent = text;
    slide.appendChild(p);
    this.strip.appendChild(slide);
    this.slides.push(slide);
  },

  _addAudioSlide(src) {
    const slide = document.createElement('div');
    slide.className = 'slide slide--audio';
    const player = AudioPlayer.create(src);
    slide.appendChild(player);
    this.strip.appendChild(slide);
    this.slides.push(slide);
  },

  next() {
    if (this.currentSlide < this.slides.length - 1) {
      this._goTo(this.currentSlide + 1);
    }
    // If at end, next project arrow handles it
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

    if (animate) {
      this.scrollLocked = true;
      setTimeout(() => { this.scrollLocked = false; }, 450);
    }

    Utils.lazyWindow(this.slides, index, 3);
  },

  close() {
    AudioPlayer.stopAll();
    this.strip.innerHTML = '';
    this.slides = [];
    this.projectData = null;
    Footer.showHome();
  },

  bindScroll() {
    const viewer = document.getElementById('viewer');

    viewer.addEventListener('wheel', (e) => {
      if (App.state.view !== 'project') return;
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

    viewer.addEventListener('touchstart', (e) => {
      if (App.state.view !== 'project') return;
      this.touchStartX = e.touches[0].clientX;
    }, { passive: true });

    viewer.addEventListener('touchend', (e) => {
      if (App.state.view !== 'project') return;
      const dx = e.changedTouches[0].clientX - this.touchStartX;
      if (Math.abs(dx) > 40) {
        if (dx < 0) this.next();
        else this.prev();
      }
    }, { passive: true });

    document.addEventListener('keydown', (e) => {
      if (App.state.view !== 'project') return;
      if (e.key === 'ArrowRight') this.next();
      else if (e.key === 'ArrowLeft') this.prev();
      else if (e.key === 'Escape') App.exitProject();
    });
  }
};
