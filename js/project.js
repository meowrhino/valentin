/* ============================================
   Project — horizontal strip, full archive
   ============================================ */

const Project = {

  strip: null,
  slides: [],
  currentSlide: 0,
  projectData: null,
  touchStartX: 0,
  touchStartY: 0,
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
    Utils.lazyWindow(this.slides, this.currentSlide, LAZY_RADIUS);
    this._goTo(this.currentSlide, false);

    // Note: footer mode switch is handled by App (not here) for proper timing
  },

  _buildFromArchive(project) {
    for (let i = 1; i <= project.imgCountArchive; i++) {
      this._addImageSlide(project.slug, i);
    }
    this._addFichaTecnicaSlide(project);
  },

  _buildFromContenido(project) {
    project.contenido.forEach(item => {
      if (item.tipo === 'imagen') {
        this._addImageSlide(project.slug, item.src);
      } else if (item.tipo === 'texto') {
        this._addTextSlide(item.contenido);
      } else if (item.tipo === 'audio') {
        this._addAudioSlide(`_PROJECTS/${project.slug}/${item.src}`);
      }
    });
    this._addFichaTecnicaSlide(project);
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

  _addFichaTecnicaSlide(project) {
    const slide = document.createElement('div');
    slide.className = 'slide slide--ficha';

    const container = document.createElement('div');
    container.className = 'ficha-content';

    if (project.descripcion) {
      const p = document.createElement('p');
      p.className = 'ficha-desc';
      p.textContent = project.descripcion;
      container.appendChild(p);
    }
    if (project.lugar) {
      const p = document.createElement('p');
      p.innerHTML = `<span class="ficha-label">Location</span> ${project.lugar}`;
      container.appendChild(p);
    }
    if (project.fecha) {
      const p = document.createElement('p');
      p.innerHTML = `<span class="ficha-label">Date</span> ${project.fecha}`;
      container.appendChild(p);
    }
    if (project.fichaTecnica && project.fichaTecnica.length) {
      const p = document.createElement('p');
      p.innerHTML = `<span class="ficha-label">Type</span> ${project.fichaTecnica.join(', ')}`;
      container.appendChild(p);
    }
    if (project.team && project.team.length) {
      const teamHtml = project.team.map(([name, url]) =>
        url ? `<a href="${url}" target="_blank">${name}</a>` : name
      ).join(', ');
      const p = document.createElement('p');
      p.innerHTML = `<span class="ficha-label">Team</span> ${teamHtml}`;
      container.appendChild(p);
    }

    slide.appendChild(container);
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
    this.strip.style.transition = animate ? SLIDE_TRANSITION : 'none';
    this.strip.style.transform = `translateX(${offset}%)`;

    if (animate) {
      this.scrollLocked = true;
      setTimeout(() => { this.scrollLocked = false; }, SCROLL_LOCK_MS);
    }

    Utils.lazyWindow(this.slides, index, LAZY_RADIUS);
  },

  close() {
    AudioPlayer.stopAll();
    this.strip.innerHTML = '';
    this.slides = [];
    this.projectData = null;
    // Note: footer mode switch is handled by App (not here) for proper timing
  },

  bindScroll() {
    const viewer = document.getElementById('viewer');

    // Shared wheel + touch handling
    Utils.bindHorizontalScroll(viewer, this, {
      next: () => this.next(),
      prev: () => this.prev(),
      isActive: () => App.state.view === 'project'
    });

    // Keyboard (project adds Escape)
    document.addEventListener('keydown', (e) => {
      if (App.state.view !== 'project') return;
      if (e.key === 'ArrowRight') this.next();
      else if (e.key === 'ArrowLeft') this.prev();
      else if (e.key === 'Escape') App.exitProject();
    });
  }
};
