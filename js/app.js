/* ============================================
   App — main orchestrator, state, routing
   ============================================ */

// Detect base path dynamically from script location:
// '/valentin/' on GH Pages, '/' on local dev
const BASE = new URL('..', document.currentScript.src).pathname;

const App = {

  state: {
    view: 'home',          // 'home' | 'project' | 'transitioning'
    mode: 'commercial',    // 'commercial' | 'personal'
    data: null,
    projects: [],
    currentProjectIndex: null,
    savedPositions: { commercial: 0, personal: 0 },
    aboutSlidePos: 0,
    typeFilter: 'all',
    allProjects: [],  // unfiltered projects for current mode
  },

  async init() {
    // Fetch data
    try {
      const res = await fetch(BASE + 'data.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.state.data = await res.json();
    } catch (err) {
      console.error('Failed to load data:', err);
      document.body.style.cssText = 'display:flex;align-items:center;justify-content:center;color:#666;font-family:monospace;font-size:0.9rem';
      document.body.textContent = 'Failed to load — please refresh';
      return;
    }
    this.state.allProjects = this._sortByType(this.state.data.projects);
    this.state.projects = this.state.allProjects;

    // Init modules
    Footer.init();
    Footer.updateSwitchIcon(this.state.mode);
    Transitions.init();
    Utils.fitMode = this._homeFitMode();
    Home.init(this.state.projects);
    Project.bindScroll();

    // Switch mode handler
    Footer.onSwitch(() => this.switchMode());

    // About handler
    Footer.onAbout(() => this.enterAbout());

    // Handle clean URL routing
    this._handleRoute();
  },

  _handleRoute() {
    let slug = null;

    // Check if 404.html stored a route
    const savedRoute = sessionStorage.getItem('route');
    if (savedRoute) {
      sessionStorage.removeItem('route');
      const match = savedRoute.match(/^\/?project\/(.+)$/);
      if (match) slug = match[1];
    }

    // Check current path (strip base prefix)
    if (!slug) {
      const path = window.location.pathname.startsWith(BASE)
        ? window.location.pathname.slice(BASE.length)
        : window.location.pathname;
      const match = path.match(/^project\/(.+)$/);
      if (match) slug = match[1];
    }

    if (slug) {
      const idx = this.state.projects.findIndex(p => p.slug === slug);
      if (idx >= 0) {
        // Direct entry — no transition, just show project immediately
        this.state.currentProjectIndex = idx;
        const project = this.state.projects[idx];
        Utils.fitMode = 'contain';
        Project.open(project, null);
        Footer.showProject(project.nombre, project.fecha);
        this._ensureMirillaOpen();
        this.state.view = 'project';
      }
    }
  },

  // --- Mode switching ---

  async switchMode() {
    if (this.state.view === 'transitioning') return;
    this.state.view = 'transitioning';

    const newMode = this.state.mode === 'commercial' ? 'personal' : 'commercial';
    const newProjects = this._sortByType(
      newMode === 'commercial'
        ? this.state.data.projects
        : this.state.data.personalProjects
    );

    if (!newProjects || !newProjects.length) {
      this.state.view = 'home';
      return;
    }

    // Get first image of first project in new mode for the grid transition
    const firstProject = newProjects[0];
    const firstImgSrc = Utils.imgPath(firstProject.slug, firstProject.fotosHome[0], firstProject.imgExt);

    // Save current mode position before switching
    this.state.savedPositions[this.state.mode] = Home.getPosition();

    const homeFit = this._homeFitMode();
    await Transitions.gridTransition(firstImgSrc, () => {

      Utils.fitMode = homeFit;
      this.state.mode = newMode;
      this.state.allProjects = newProjects;
      this.state.projects = newProjects;
      this.state.typeFilter = 'all';
      Home.init(this.state.projects);
      // Restore saved position for the new mode
      Home.setPosition(this.state.savedPositions[newMode]);
      Footer.updateSwitchIcon(newMode);
    }, homeFit);

    history.pushState(null, '', BASE);
    this.state.view = 'home';
  },

  // --- About ---

  async enterAbout() {
    if (this.state.view === 'transitioning') return;
    this.state.view = 'transitioning';

    const about = this.state.data.about;
    this.state.savedPositions[this.state.mode] = Home.getPosition();

    const firstImgSrc = Utils.imgPath(about.slug, 1, about.imgExt);
    const savedAboutPos = this.state.aboutSlidePos;

    // Switch footer before grid so crossfade is visible during transition
    Footer.showProject('Valentin Barrio', '');

    await Transitions.gridTransition(firstImgSrc, () => {
      Utils.fitMode = 'contain';
      this.state.currentProjectIndex = -1; // special: about
      Project.open(about, null);
      // Restore saved about position
      if (savedAboutPos > 0) {
        Project._goTo(savedAboutPos, false);
      }
      this._ensureMirillaOpen();
    }, 'contain');

    history.pushState(null, '', `${BASE}about`);
    this.state.view = 'project';
  },

  // --- Navigation ---

  async enterProject(projectIndex, startPhotoNum) {
    if (this.state.view === 'transitioning') return;
    this.state.view = 'transitioning';

    // Save home position for current mode
    this.state.savedPositions[this.state.mode] = Home.getPosition();
    this.state.currentProjectIndex = projectIndex;

    const project = this.state.projects[projectIndex];

    // Update URL
    history.pushState(null, '', `${BASE}project/${project.slug}`);

    // Switch footer with crossfade
    Footer.showProject(project.nombre, project.fecha);

    // Mobile: use grid transition; Desktop: use mirilla
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      const firstImgSrc = Utils.imgPath(project.slug, startPhotoNum || 1, project.imgExt);
      await Transitions.gridTransition(firstImgSrc, () => {
        Utils.fitMode = 'contain';
        Project.open(project, startPhotoNum);
      }, 'contain');
    } else {
      Utils.fitMode = 'contain';
      Project.open(project, startPhotoNum);
      const firstImages = this._getFirstStripImages(3);
      await Transitions.openMirillaWithLoading(firstImages);
    }

    this.state.view = 'project';
  },

  async exitProject() {
    if (this.state.view === 'transitioning') return;
    this.state.view = 'transitioning';

    // Save about position if coming from about
    if (this.state.currentProjectIndex === -1) {
      this.state.aboutSlidePos = Project.currentSlide;
    }

    // Stop audio
    AudioPlayer.stopAll();

    // Switch footer back with crossfade
    Footer.showHome();

    const isMobile = window.innerWidth <= 768;
    const homeFit = this._homeFitMode();

    if (isMobile) {
      // Mobile: use grid transition to go back to home
      const currentProject = this.state.projects[0]; // first project for grid image
      const firstImgSrc = Utils.imgPath(currentProject.slug, currentProject.fotosHome[0], currentProject.imgExt);
      await Transitions.gridTransition(firstImgSrc, () => {
        Utils.fitMode = homeFit;
        Project.close();
        Home.show();
        Home.setPosition(this.state.savedPositions[this.state.mode]);
      }, homeFit);
    } else {
      // Desktop: close mirilla
      await Transitions.closeMirilla();
      Utils.fitMode = homeFit;
      Project.close();
      Home.show();
      Home.setPosition(this.state.savedPositions[this.state.mode]);
    }

    // Update URL
    history.pushState(null, '', BASE);

    this.state.currentProjectIndex = null;
    this.state.view = 'home';
  },

  async nextProject() {
    if (this.state.view === 'transitioning') return;
    this.state.view = 'transitioning';

    // If in about, go to first project
    if (this.state.currentProjectIndex === -1) {
      const firstProject = this.state.projects[0];
      const firstImgSrc = Utils.imgPath(firstProject.slug, 1, firstProject.imgExt);
      AudioPlayer.stopAll();
      Footer.showProject(firstProject.nombre, firstProject.fecha);
      await Transitions.gridTransition(firstImgSrc, () => {
        Utils.fitMode = 'contain';
        this.state.currentProjectIndex = 0;
        Project.open(firstProject, null);
      }, 'contain');
      history.pushState(null, '', `${BASE}project/${firstProject.slug}`);
      this.state.view = 'project';
      return;
    }

    const nextIdx = (this.state.currentProjectIndex + 1) % this.state.projects.length;
    const nextProject = this.state.projects[nextIdx];
    const firstImgSrc = Utils.imgPath(nextProject.slug, 1, nextProject.imgExt);

    // Stop current audio
    AudioPlayer.stopAll();

    // Switch footer before grid so crossfade is visible during transition
    Footer.showProject(nextProject.nombre, nextProject.fecha);

    // Run 8x8 grid transition — update strip while screen is black
    await Transitions.gridTransition(firstImgSrc, () => {
      Utils.fitMode = 'contain';
      this.state.currentProjectIndex = nextIdx;
      Project.open(nextProject, null);
    }, 'contain');

    // Update URL
    history.pushState(null, '', `${BASE}project/${nextProject.slug}`);

    this.state.view = 'project';
  },

  // --- Previous project ---
  async prevProject() {
    if (this.state.view === 'transitioning') return;
    if (this.state.currentProjectIndex === null || this.state.currentProjectIndex < 0) return;
    this.state.view = 'transitioning';

    const prevIdx = (this.state.currentProjectIndex - 1 + this.state.projects.length) % this.state.projects.length;
    const prevProject = this.state.projects[prevIdx];
    const firstImgSrc = Utils.imgPath(prevProject.slug, 1, prevProject.imgExt);

    AudioPlayer.stopAll();
    Footer.showProject(prevProject.nombre, prevProject.fecha);

    await Transitions.gridTransition(firstImgSrc, () => {
      Utils.fitMode = 'contain';
      this.state.currentProjectIndex = prevIdx;
      Project.open(prevProject, null);
    }, 'contain');

    history.pushState(null, '', `${BASE}project/${prevProject.slug}`);
    this.state.view = 'project';
  },

  // --- Go to specific project (from project menu) ---
  async goToProject(projectIndex) {
    if (this.state.view === 'transitioning') return;
    if (projectIndex === this.state.currentProjectIndex) return;
    this.state.view = 'transitioning';

    const project = this.state.projects[projectIndex];
    const firstImgSrc = Utils.imgPath(project.slug, 1, project.imgExt);

    AudioPlayer.stopAll();
    Footer.showProject(project.nombre, project.fecha);

    await Transitions.gridTransition(firstImgSrc, () => {
      Utils.fitMode = 'contain';
      this.state.currentProjectIndex = projectIndex;
      Project.open(project, null);
    }, 'contain');

    history.pushState(null, '', `${BASE}project/${project.slug}`);
    this.state.view = 'project';
  },

  // --- Filter by type (home) ---
  async filterByType(type) {
    if (this.state.view === 'transitioning') return;
    this.state.view = 'transitioning';

    this.state.typeFilter = type;
    let filtered;
    if (type === 'all') {
      filtered = this.state.allProjects;
    } else {
      filtered = this.state.allProjects.filter(p =>
        p.type && p.type.toLowerCase() === type
      );
    }

    if (!filtered.length) {
      this.state.view = 'home';
      return;
    }

    this.state.projects = filtered;
    const firstProject = filtered[0];
    const firstImgSrc = Utils.imgPath(firstProject.slug, firstProject.fotosHome[0], firstProject.imgExt);

    this.state.savedPositions[this.state.mode] = Home.getPosition();

    const homeFit = this._homeFitMode();
    await Transitions.gridTransition(firstImgSrc, () => {
      Utils.fitMode = homeFit;
      Home.init(this.state.projects);
    }, homeFit);

    history.pushState(null, '', BASE);
    this.state.view = 'home';
  },

  // Home fitMode: contain on mobile, cover on desktop
  _homeFitMode() {
    return window.innerWidth <= 768 ? 'contain' : 'cover';
  },

  // Instantly set mirilla to open state (no animation)
  _ensureMirillaOpen() {
    const m = document.getElementById('mirilla');
    m.style.transition = 'none';
    m.classList.add('mirilla--open');
    requestAnimationFrame(() => { m.style.transition = ''; });
  },

  // Sort projects by type, preserving first-appearance order of types in the array
  _sortByType(projects) {
    if (!projects || !projects.length) return projects;
    // Discover type order from first appearance
    const typeOrder = [];
    projects.forEach(p => {
      const type = p.type ? p.type.toLowerCase() : 'other';
      if (!typeOrder.includes(type)) typeOrder.push(type);
    });
    // Stable sort: group by type, keep original order within each type
    return [...projects].sort((a, b) => {
      const typeA = a.type ? a.type.toLowerCase() : 'other';
      const typeB = b.type ? b.type.toLowerCase() : 'other';
      return typeOrder.indexOf(typeA) - typeOrder.indexOf(typeB);
    });
  },

  // Helper: get first N img elements from the current strip
  _getFirstStripImages(n) {
    const strip = document.getElementById('strip');
    const imgs = strip.querySelectorAll('img[data-src]');
    const result = [];
    for (let i = 0; i < Math.min(n, imgs.length); i++) {
      // Trigger load by setting src
      if (imgs[i].dataset.src && !imgs[i].src) {
        imgs[i].src = imgs[i].dataset.src;
      }
      result.push(imgs[i]);
    }
    return result;
  }
};

// Handle browser back/forward
window.addEventListener('popstate', () => {
  const raw = window.location.pathname;
  const path = raw.startsWith(BASE) ? raw.slice(BASE.length) : raw;
  if (path === '' || path === '/') {
    if (App.state.view === 'project') {
      App.exitProject();
    }
  } else {
    const match = path.match(/^project\/(.+)$/);
    if (match) {
      const slug = match[1];
      const idx = App.state.projects.findIndex(p => p.slug === slug);
      if (idx >= 0 && App.state.view === 'home') {
        App.enterProject(idx, null);
      }
    }
  }
});

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
