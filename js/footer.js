/* ============================================
   Footer — home/project modes, marquee, menu
   ============================================ */

const Footer = {

  els: {},

  lenguetaOpen: false,

  init() {
    this.els.home = document.getElementById('footer-home');
    this.els.project = document.getElementById('footer-project');
    this.els.projectName = document.getElementById('footer-project-name');
    this.els.marquee = document.getElementById('marquee-text');
    this.els.switchBtn = document.getElementById('footer-switch');
    this.els.aboutBtn = document.getElementById('footer-about');
    this.els.lengueta = document.getElementById('lengueta');
    this.els.lenguetaContent = document.getElementById('lengueta-content');
    this.els.marqueeWrap = document.querySelector('.footer__marquee');

    // Home: project name (center) opens menu
    this.els.projectName.addEventListener('click', () => this.toggleLengueta());

    // Project: entire footer opens menu (marquee area)
    this.els.marqueeWrap.addEventListener('click', () => {
      if (App.state.view === 'project' && !this.lenguetaOpen) this.toggleLengueta();
    });
  },

  // Update the project name shown in home footer center (with crossfade)
  setHomeName(name, fecha) {
    const isPersonal = App.state.mode === 'personal';
    const filter = App.state.typeFilter;
    const newText = (filter && filter !== 'all')
      ? filter
      : (isPersonal ? (fecha || name) : name);

    // Only animate if text actually changed
    if (this.els.projectName.textContent !== newText) {
      this.els.projectName.style.opacity = '0';
      setTimeout(() => {
        this.els.projectName.textContent = newText;
        this.els.projectName.style.opacity = '';
      }, 250); // matches CSS transition duration
    }

    this.els.aboutBtn.innerHTML = isPersonal ? 'valentín' : 'valentín<span class="about-surname"> barrio</span>';
    this.closeLengueta();
  },

  setLenguetaProject(project) {
    this._currentProject = project;
  },

  toggleLengueta() {
    if (App.state.view === 'transitioning') return;
    if (this.lenguetaOpen) {
      this.closeLengueta();
    } else {
      this.openLengueta();
    }
  },

  _groupByType(projects) {
    const groups = {};
    projects.forEach((p, idx) => {
      const type = (p.fichaTecnica && p.fichaTecnica[0]) ? p.fichaTecnica[0].toLowerCase() : 'other';
      if (!groups[type]) groups[type] = [];
      groups[type].push({ project: p, index: idx });
    });
    return groups;
  },

  openLengueta() {
    const projects = App.state.projects;
    if (!projects || !projects.length) return;

    const isHome = App.state.view === 'home';
    const isProject = App.state.view === 'project';
    const isAbout = isProject && App.state.currentProjectIndex === -1;
    const isPersonal = App.state.mode === 'personal';
    const groups = this._groupByType(projects);

    // Find current project
    let currentSlug = null;
    if (this._currentProject) currentSlug = this._currentProject.slug;
    if (App.state.currentProjectIndex >= 0) {
      currentSlug = projects[App.state.currentProjectIndex]?.slug;
    }

    let html = '';

    if (isHome) {
      // HOME MENU: ALL + types with projects grouped
      const currentFilter = App.state.typeFilter || 'all';
      const allClass = currentFilter === 'all' ? ' lengueta__item--active' : '';
      html += `<div class="lengueta__type-header lengueta__item${allClass}" data-filter="all">All</div>`;

      for (const type in groups) {
        const typeActive = currentFilter === type ? ' lengueta__item--active' : '';
        html += `<div class="lengueta__type-header lengueta__item${typeActive}" data-filter="${type}">${type}</div>`;
        html += `<div class="lengueta__group">`;
        groups[type].forEach(({ project, index }) => {
          const label = isPersonal ? (project.fecha || project.nombre) : project.nombre;
          const activeClass = project.slug === currentSlug ? ' lengueta__item--active' : '';
          html += `<div class="lengueta__project lengueta__item${activeClass}" data-project-index="${index}">${label}</div>`;
        });
        html += `</div>`;
      }
    } else {
      // PROJECT MENU: types + projects, then back to home at bottom
      for (const type in groups) {
        html += `<div class="lengueta__type-header">${type}</div>`;
        html += `<div class="lengueta__group">`;
        groups[type].forEach(({ project, index }) => {
          const label = isPersonal ? (project.fecha || project.nombre) : project.nombre;
          const activeClass = project.slug === currentSlug ? ' lengueta__item--active' : '';
          html += `<div class="lengueta__project lengueta__item${activeClass}" data-project-index="${index}">${label}</div>`;
        });
        html += `</div>`;
      }

      html += `<div class="lengueta__nav lengueta__item" data-action="home">back to home</div>`;
    }

    this.els.lenguetaContent.innerHTML = html;
    this.els.lengueta.classList.add('lengueta--open');

    // Home: show ✕ in project name
    if (isHome) {
      this._savedProjectName = this.els.projectName.textContent;
      this.els.projectName.textContent = '✕';
      this.els.projectName.classList.add('footer__close');
    }

    // Project: crossfade marquee → nav bar (prev | ✕ | next)
    if (isProject) {
      this._marqueeHTML = this.els.marqueeWrap.innerHTML;
      this.els.marqueeWrap.style.opacity = '0';
      setTimeout(() => {
        if (isAbout) {
          this.els.marqueeWrap.innerHTML = '<div class="footer__menu-bar"><span></span><span class="footer__close" id="menu-close">✕</span><span></span></div>';
        } else {
          this.els.marqueeWrap.innerHTML = '<div class="footer__menu-bar"><span class="footer__menu-nav" data-action="prev">← prev</span><span class="footer__close" id="menu-close">✕</span><span class="footer__menu-nav" data-action="next">next →</span></div>';
        }
        this.els.marqueeWrap.style.opacity = '';
        // Bind close + nav clicks (stopPropagation prevents marqueeWrap from reopening)
        const menuBar = this.els.marqueeWrap.querySelector('.footer__menu-bar');
        menuBar.addEventListener('click', (e) => {
          e.stopPropagation();
          const nav = e.target.closest('.footer__menu-nav');
          if (nav) {
            this.closeLengueta();
            if (nav.dataset.action === 'prev') App.prevProject();
            else if (nav.dataset.action === 'next') App.nextProject();
            return;
          }
          if (e.target.id === 'menu-close') {
            this.closeLengueta();
          }
        });
      }, 250);
    }

    this.lenguetaOpen = true;

    // Event delegation
    this.els.lenguetaContent.onclick = (e) => {
      const item = e.target.closest('.lengueta__item');
      if (!item) return;

      if (item.dataset.filter !== undefined) {
        this.closeLengueta();
        App.filterByType(item.dataset.filter);
        return;
      }

      if (item.dataset.action) {
        this.closeLengueta();
        if (item.dataset.action === 'home') App.exitProject();
        else if (item.dataset.action === 'prev') App.prevProject();
        else if (item.dataset.action === 'next') App.nextProject();
        return;
      }

      const idx = parseInt(item.dataset.projectIndex);
      if (isNaN(idx)) return;
      this.closeLengueta();
      if (isHome) {
        App.enterProject(idx, null);
      } else {
        App.goToProject(idx);
      }
    };

    // Close on click outside
    setTimeout(() => {
      this._closeLenguetaHandler = (e) => {
        if (!this.els.lengueta.contains(e.target) &&
            !this.els.projectName.contains(e.target) &&
            !this.els.marqueeWrap.contains(e.target)) {
          this.closeLengueta();
        }
      };
      document.addEventListener('click', this._closeLenguetaHandler);
    }, 10);

    this._closeLenguetaEsc = (e) => {
      if (e.key === 'Escape') this.closeLengueta();
    };
    document.addEventListener('keydown', this._closeLenguetaEsc);
  },

  closeLengueta() {
    this.els.lengueta.classList.remove('lengueta--open');

    // Restore home project name
    if (this._savedProjectName) {
      this.els.projectName.textContent = this._savedProjectName;
      this._savedProjectName = null;
    }
    this.els.projectName.classList.remove('footer__close');

    // Restore marquee with crossfade
    if (this._marqueeHTML) {
      const savedHTML = this._marqueeHTML;
      this._marqueeHTML = null;
      this.els.marqueeWrap.style.opacity = '0';
      this._restoreMarqueeTimer = setTimeout(() => {
        this._restoreMarqueeTimer = null;
        this.els.marqueeWrap.innerHTML = savedHTML;
        this.els.marqueeWrap.style.opacity = '';
        // Re-acquire marquee reference since innerHTML replaced it
        this.els.marquee = document.getElementById('marquee-text');
      }, 250);
    }

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

  showProject(name, fecha) {
    document.body.classList.add('view-project');

    // Cancel any pending marquee restore from closeLengueta
    if (this._restoreMarqueeTimer) {
      clearTimeout(this._restoreMarqueeTimer);
      this._restoreMarqueeTimer = null;
      this.els.marqueeWrap.style.opacity = '';
    }

    // Re-acquire marquee reference (may have been replaced by menu bar)
    const marquee = document.getElementById('marquee-text');
    if (!marquee) {
      // Menu bar is showing — restore marquee structure first
      this.els.marqueeWrap.innerHTML = '<div class="footer__marquee-inner" id="marquee-text"></div>';
      this.els.marquee = document.getElementById('marquee-text');
    }

    const isPersonal = App.state.mode === 'personal';
    const label = isPersonal ? (fecha || name) : name;
    let spans = '';
    for (let i = 0; i < 40; i++) {
      spans += `<span>${label}</span>`;
    }
    this.els.marquee.innerHTML = spans;

    // Restart marquee animation so it begins from 0
    this.els.marquee.style.animation = 'none';
    this.els.marquee.offsetHeight; // force reflow
    this.els.marquee.style.animation = '';
  },

  showHome() {
    document.body.classList.remove('view-project');
  },

  updateSwitchIcon(currentMode) {
    if (currentMode === 'commercial') {
      this.els.switchBtn.innerHTML = '<svg class="switch-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3" fill="#fff" stroke="none"/></svg>';
      this.els.switchBtn.title = 'personal';
    } else {
      this.els.switchBtn.innerHTML = '<svg class="switch-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></svg>';
      this.els.switchBtn.title = 'commercial';
    }
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
    ctx.beginPath();
    ctx.arc(16, 16, 10, 0, Math.PI * 2);
    ctx.stroke();
    if (currentMode === 'personal') {
      ctx.beginPath();
      ctx.arc(16, 16, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    let link = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.type = 'image/png';
    link.href = canvas.toDataURL('image/png');
  },

  onSwitch(fn) {
    this.els.switchBtn.addEventListener('click', fn);
  },

  onAbout(fn) {
    this.els.aboutBtn.addEventListener('click', fn);
  }
};
