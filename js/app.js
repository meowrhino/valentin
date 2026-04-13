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
  },

  async init() {
    // Fetch data
    try {
      const res = await fetch(BASE + 'data.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.state.data = await res.json();
    } catch (err) {
      console.error('Failed to load data:', err);
      return;
    }
    this.state.projects = this.state.data.projects;

    // Init modules
    Footer.init();
    Footer.updateSwitchIcon(this.state.mode);
    Transitions.init();
    Home.init(this.state.projects);
    Project.bindScroll();

    // Footer arrow handlers
    Footer.onBack(() => this.exitProject());
    Footer.onNext(() => this.nextProject());

    // Switch mode handler
    Footer.onSwitch(() => this.switchMode());

    // About handler
    Footer.onAbout(() => this.enterAbout());

    // Toggle cover/contain with C key (for testing)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'c' || e.key === 'C') {
        Utils.fitMode = Utils.fitMode === 'cover' ? 'contain' : 'cover';
        console.log('Fit mode:', Utils.fitMode);
        Home._resizeAll();
        Project._resizeAll();
      }
    });

    // Handle clean URL routing
    this._handleRoute();
  },

  _handleRoute() {
    // Check if 404.html stored a route
    const savedRoute = sessionStorage.getItem('route');
    if (savedRoute) {
      sessionStorage.removeItem('route');
      const match = savedRoute.match(/^\/?project\/(.+)$/);
      if (match) {
        const slug = match[1];
        const idx = this.state.projects.findIndex(p => p.slug === slug);
        if (idx >= 0) {
          this.enterProject(idx, null);
          return;
        }
      }
    }

    // Check current path (strip base prefix)
    const path = window.location.pathname.startsWith(BASE)
      ? window.location.pathname.slice(BASE.length)
      : window.location.pathname;
    const match = path.match(/^project\/(.+)$/);
    if (match) {
      const slug = match[1];
      const idx = this.state.projects.findIndex(p => p.slug === slug);
      if (idx >= 0) {
        this.enterProject(idx, null);
        return;
      }
    }
  },

  // --- Mode switching ---

  async switchMode() {
    if (this.state.view === 'transitioning') return;
    this.state.view = 'transitioning';

    const newMode = this.state.mode === 'commercial' ? 'personal' : 'commercial';
    const newProjects = newMode === 'commercial'
      ? this.state.data.projects
      : this.state.data.personalProjects;

    if (!newProjects || !newProjects.length) {
      this.state.view = 'home';
      return;
    }

    // Get first image of first project in new mode for the grid transition
    const firstProject = newProjects[0];
    const firstImgSrc = Utils.imgPath(firstProject.slug, firstProject.fotosHome[0], firstProject.imgExt);

    // Save current mode position before switching
    this.state.savedPositions[this.state.mode] = Home.getPosition();

    await Transitions.gridTransition(firstImgSrc, () => {
      this.state.mode = newMode;
      this.state.projects = newProjects;
      Home.init(this.state.projects);
      // Restore saved position for the new mode
      Home.setPosition(this.state.savedPositions[newMode]);
      Footer.updateSwitchIcon(newMode);
    });

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
    Footer.showProject(about.nombre, about.fecha);

    await Transitions.gridTransition(firstImgSrc, () => {
      this.state.currentProjectIndex = -1; // special: about
      Project.open(about, null);
      // Restore saved about position
      if (savedAboutPos > 0) {
        Project._goTo(savedAboutPos, false);
      }
      this._ensureMirillaOpen();
    });

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

    // Build project slides (hidden behind mirilla)
    Project.open(project, startPhotoNum);

    // Switch footer with crossfade
    Footer.showProject(project.nombre, project.fecha);

    // Open mirilla — wait for first few images to load
    const firstImages = this._getFirstStripImages(3);
    await Transitions.openMirillaWithLoading(firstImages);

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

    // Close mirilla
    await Transitions.closeMirilla();

    // Restore home at saved position for current mode
    Project.close();
    Home.show();
    Home.setPosition(this.state.savedPositions[this.state.mode]);

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
        this.state.currentProjectIndex = 0;
        Project.open(firstProject, null);
      });
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
      this.state.currentProjectIndex = nextIdx;
      Project.open(nextProject, null);
    });

    // Update URL
    history.pushState(null, '', `${BASE}project/${nextProject.slug}`);

    this.state.view = 'project';
  },

  // Instantly set mirilla to open state (no animation)
  _ensureMirillaOpen() {
    const m = document.getElementById('mirilla');
    m.style.transition = 'none';
    m.classList.add('mirilla--open');
    requestAnimationFrame(() => { m.style.transition = ''; });
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
