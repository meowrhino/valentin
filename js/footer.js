/* ============================================
   Footer — home/project modes, marquee, switch
   ============================================ */

const Footer = {

  els: {},

  lenguetaOpen: false,

  init() {
    this.els.home = document.getElementById('footer-home');
    this.els.project = document.getElementById('footer-project');
    this.els.projectName = document.getElementById('footer-project-name');
    this.els.marquee = document.getElementById('marquee-text');
    this.els.btnBack = document.getElementById('btn-back');
    this.els.btnNext = document.getElementById('btn-next');
    this.els.switchBtn = document.getElementById('footer-switch');
    this.els.aboutBtn = document.getElementById('footer-about');
    this.els.lengueta = document.getElementById('lengueta');
    this.els.lenguetaContent = document.getElementById('lengueta-content');

    // Toggle lengüeta on project name click
    this.els.projectName.addEventListener('click', () => this.toggleLengueta());
  },

  // Update the project name shown in home footer center
  setHomeName(name, fecha) {
    const isPersonal = App.state.mode === 'personal';
    this.els.projectName.textContent = isPersonal ? (fecha || name) : name;
    // Update left side name for personal mode
    this.els.aboutBtn.textContent = isPersonal ? 'valentín' : 'valentin barrio';
    // Close lengüeta when project changes
    this.closeLengueta();
  },

  // Update lengüeta content with current project data
  setLenguetaProject(project) {
    this._currentProject = project;
  },

  toggleLengueta() {
    // Lengüeta only available in home view
    if (App.state.view !== 'home') return;
    if (this.lenguetaOpen) {
      this.closeLengueta();
    } else {
      this.openLengueta();
    }
  },

  openLengueta() {
    const projects = App.state.projects;
    if (!projects || !projects.length) return;

    // Find current project index
    let currentIdx = -1;
    if (App.state.currentProjectIndex !== null && App.state.currentProjectIndex >= 0) {
      currentIdx = App.state.currentProjectIndex;
    } else if (App.state.view === 'home' && this._currentProject) {
      currentIdx = projects.findIndex(p => p.slug === this._currentProject.slug);
    }

    // Build cyclic order: current project first, then the rest in order
    const order = [];
    if (currentIdx >= 0) {
      order.push(currentIdx);
      for (let i = 1; i < projects.length; i++) {
        order.push((currentIdx + i) % projects.length);
      }
    } else {
      for (let i = 0; i < projects.length; i++) order.push(i);
    }

    // Build project list — show fecha (date) instead of nombre in personal mode
    const isPersonal = App.state.mode === 'personal';
    let html = '';
    order.forEach((idx, pos) => {
      const p = projects[idx];
      const isActive = idx === currentIdx;
      const activeClass = isActive ? ' lengueta__item--active' : '';
      const label = isPersonal ? (p.fecha || p.nombre) : p.nombre;
      html += `<div class="lengueta__item${activeClass}" data-project-index="${idx}">${label}</div>`;
    });

    this.els.lenguetaContent.innerHTML = html;
    this.els.lengueta.classList.add('lengueta--open');
    this.els.projectName.style.opacity = '0';
    this.lenguetaOpen = true;

    // Bind click handlers — scroll to project's first image in home strip
    this.els.lenguetaContent.querySelectorAll('.lengueta__item').forEach(item => {
      item.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.projectIndex);
        this.closeLengueta();
        Home.scrollToProject(idx);
      });
    });

    // Close on click outside (deferred to avoid immediate trigger)
    setTimeout(() => {
      this._closeLenguetaHandler = (e) => {
        if (!this.els.lengueta.contains(e.target) && !this.els.projectName.contains(e.target)) {
          this.closeLengueta();
        }
      };
      document.addEventListener('click', this._closeLenguetaHandler);
    }, 10);

    // Close on Escape
    this._closeLenguetaEsc = (e) => {
      if (e.key === 'Escape') this.closeLengueta();
    };
    document.addEventListener('keydown', this._closeLenguetaEsc);
  },

  closeLengueta() {
    this.els.lengueta.classList.remove('lengueta--open');
    this.els.projectName.style.opacity = '';
    this.lenguetaOpen = false;
    if (this._closeLenguetaHandler) {
      document.removeEventListener('click', this._closeLenguetaHandler);
      this._closeLenguetaHandler = null;
    }
    if (this._closeLenguetaEsc) {
      document.removeEventListener('keydown', this._closeLenguetaEsc);
      this._closeLenguetaEsc = null;
    }
  },

  // Switch to project footer mode with marquee
  showProject(name, fecha) {
    document.body.classList.add('view-project');
    const isPersonal = App.state.mode === 'personal';
    const label = isPersonal ? (fecha || name) : name;
    // Fill marquee with individual spans (2x for seamless loop)
    let spans = '';
    for (let i = 0; i < 40; i++) {
      spans += `<span>${label}</span>`;
    }
    this.els.marquee.innerHTML = spans;
  },

  // Switch back to home footer mode
  showHome() {
    document.body.classList.remove('view-project');
  },

  // Update switch icon based on mode — circle with/without dot
  updateSwitchIcon(currentMode) {
    if (currentMode === 'commercial') {
      // Circle with dot = click to go personal
      this.els.switchBtn.innerHTML = '<svg class="switch-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3" fill="#fff" stroke="none"/></svg>';
      this.els.switchBtn.title = 'personal';
    } else {
      // Empty circle = click to go commercial
      this.els.switchBtn.innerHTML = '<svg class="switch-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></svg>';
      this.els.switchBtn.title = 'commercial';
    }
    // Update favicon to the opposite icon, in black
    this._updateFavicon(currentMode);
  },

  _updateFavicon(currentMode) {
    const canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 32;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 32, 32);
    ctx.strokeStyle = '#000';
    ctx.fillStyle = '#000';
    ctx.lineWidth = 1.5;
    // Draw opposite icon: if commercial, favicon = empty circle (personal icon)
    ctx.beginPath();
    ctx.arc(16, 16, 10, 0, Math.PI * 2);
    ctx.stroke();
    if (currentMode === 'personal') {
      // Favicon = circle with dot (commercial icon)
      ctx.beginPath();
      ctx.arc(16, 16, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    // Set as favicon
    let link = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.type = 'image/png';
    link.href = canvas.toDataURL('image/png');
  },

  // Bind arrow callbacks
  onBack(fn) {
    this.els.btnBack.addEventListener('click', fn);
  },

  onNext(fn) {
    this.els.btnNext.addEventListener('click', fn);
  },

  onSwitch(fn) {
    this.els.switchBtn.addEventListener('click', fn);
  },

  onAbout(fn) {
    this.els.aboutBtn.addEventListener('click', fn);
  }
};
