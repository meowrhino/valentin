/* ============================================
   App — main orchestrator, state, routing
   ============================================ */

const App = {

  state: {
    view: 'home',          // 'home' | 'project' | 'transitioning'
    mode: 'commercial',    // 'commercial' | 'personal'
    data: null,
    projects: [],
    currentProjectIndex: null,
    homeSlidePos: 0,
  },

  async init() {
    // Fetch data
    try {
      const res = await fetch('/data.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.state.data = await res.json();
    } catch (err) {
      console.error('Failed to load data:', err);
      return;
    }
    this.state.projects = this.state.data.projects;

    // Init modules
    Footer.init();
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

    // Handle clean URL routing
    this._handleRoute();
  },

  _handleRoute() {
    // Check if 404.html stored a route
    const savedRoute = sessionStorage.getItem('route');
    if (savedRoute) {
      sessionStorage.removeItem('route');
      const match = savedRoute.match(/^\/project\/(.+)$/);
      if (match) {
        const slug = match[1];
        const idx = this.state.projects.findIndex(p => p.slug === slug);
        if (idx >= 0) {
          this.enterProject(idx, null);
          return;
        }
      }
    }

    // Check current path
    const path = window.location.pathname;
    const match = path.match(/^\/project\/(.+)$/);
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

    // Get first image of first project in new mode for the grid transition
    const firstProject = newProjects[0];
    const firstImgSrc = Utils.imgPath(firstProject.slug, firstProject.fotosHome[0], firstProject.imgExt);

    await Transitions.gridTransition(firstImgSrc, () => {
      this.state.mode = newMode;
      this.state.projects = newProjects;
      this.state.homeSlidePos = 0;
      Home.init(this.state.projects);
      Footer.updateSwitchIcon(newMode);
    });

    history.pushState(null, '', '/');
    this.state.view = 'home';
  },

  // --- About ---

  async enterAbout() {
    if (this.state.view === 'transitioning') return;
    this.state.view = 'transitioning';

    const about = this.state.data.about;
    this.state.homeSlidePos = Home.getPosition();

    const firstImgSrc = Utils.imgPath(about.slug, 1, about.imgExt);
    await Transitions.gridTransition(firstImgSrc, () => {
      this.state.currentProjectIndex = -1; // special: about
      Project.open(about, null);
    });

    history.pushState(null, '', '/about');
    this.state.view = 'project';
  },

  // --- Navigation ---

  async enterProject(projectIndex, startPhotoNum) {
    if (this.state.view === 'transitioning') return;
    this.state.view = 'transitioning';

    // Save home position
    this.state.homeSlidePos = Home.getPosition();
    this.state.currentProjectIndex = projectIndex;

    const project = this.state.projects[projectIndex];

    // Update URL
    history.pushState(null, '', `/project/${project.slug}`);

    // Build project slides (hidden behind mirilla)
    Project.open(project, startPhotoNum);

    // Open mirilla — wait for first few images to load
    const firstImages = this.strip_querySelectorAll_imgs(3);
    await Transitions.openMirillaWithLoading(firstImages);

    this.state.view = 'project';
  },

  async exitProject() {
    if (this.state.view === 'transitioning') return;
    this.state.view = 'transitioning';

    // Stop audio
    AudioPlayer.stopAll();

    // Close mirilla
    await Transitions.closeMirilla();

    // Restore home
    Project.close();
    Home.show();
    Home.setPosition(this.state.homeSlidePos);

    // Update URL
    history.pushState(null, '', '/');

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
      await Transitions.gridTransition(firstImgSrc, () => {
        this.state.currentProjectIndex = 0;
        Project.open(firstProject, null);
      });
      history.pushState(null, '', `/project/${firstProject.slug}`);
      this.state.view = 'project';
      return;
    }

    const nextIdx = (this.state.currentProjectIndex + 1) % this.state.projects.length;
    const nextProject = this.state.projects[nextIdx];
    const firstImgSrc = Utils.imgPath(nextProject.slug, 1, nextProject.imgExt);

    // Stop current audio
    AudioPlayer.stopAll();

    // Run 8x8 grid transition — update strip while screen is black
    await Transitions.gridTransition(firstImgSrc, () => {
      this.state.currentProjectIndex = nextIdx;
      Project.open(nextProject, null);
    });

    // Update URL
    history.pushState(null, '', `/project/${nextProject.slug}`);

    this.state.view = 'project';
  },

  // Go to a specific project by index (from lengüeta menu, works from home or project)
  async goToProject(projectIndex) {
    if (this.state.view === 'transitioning') return;
    const wasHome = this.state.view === 'home';
    this.state.view = 'transitioning';

    if (wasHome) {
      this.state.homeSlidePos = Home.getPosition();
    }

    const project = this.state.projects[projectIndex];
    const firstImgSrc = Utils.imgPath(project.slug, 1, project.imgExt);

    AudioPlayer.stopAll();

    await Transitions.gridTransition(firstImgSrc, () => {
      this.state.currentProjectIndex = projectIndex;
      Project.open(project, null);
    });

    history.pushState(null, '', `/project/${project.slug}`);
    this.state.view = 'project';
  },

  // Helper: get first N img elements from the current strip
  strip_querySelectorAll_imgs(n) {
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
  const path = window.location.pathname;
  if (path === '/' || path === '') {
    if (App.state.view === 'project') {
      App.exitProject();
    }
  } else {
    const match = path.match(/^\/project\/(.+)$/);
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
