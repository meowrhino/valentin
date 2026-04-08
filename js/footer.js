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
  setHomeName(name) {
    this.els.projectName.textContent = name;
    // Close lengüeta when project changes
    this.closeLengueta();
  },

  // Update lengüeta content with current project data
  setLenguetaProject(project) {
    this._currentProject = project;
  },

  toggleLengueta() {
    if (this.lenguetaOpen) {
      this.closeLengueta();
    } else {
      this.openLengueta();
    }
  },

  openLengueta() {
    const projects = App.state.projects;
    if (!projects || !projects.length) return;

    // Build project list
    let html = '';
    projects.forEach((p, idx) => {
      const isActive = App.state.currentProjectIndex === idx ||
        (App.state.view === 'home' && this._currentProject && this._currentProject.slug === p.slug);
      const activeClass = isActive ? ' lengueta__item--active' : '';
      html += `<div class="lengueta__item${activeClass}" data-project-index="${idx}">${p.nombre}</div>`;
    });

    this.els.lenguetaContent.innerHTML = html;
    this.els.lengueta.classList.add('lengueta--open');
    this.lenguetaOpen = true;

    // Bind click handlers
    this.els.lenguetaContent.querySelectorAll('.lengueta__item').forEach(item => {
      item.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.projectIndex);
        this.closeLengueta();
        // Always use grid transition from lengüeta (direct navigation)
        App.goToProject(idx);
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
  showProject(name) {
    document.body.classList.add('view-project');
    // Fill marquee with individual spans (2x for seamless loop)
    let spans = '';
    for (let i = 0; i < 40; i++) {
      spans += `<span>${name}</span>`;
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
