/* ============================================
   App — main orchestrator, state, routing
   ============================================ */

const App = {

  state: {
    view: 'home',          // 'home' | 'project' | 'transitioning'
    projects: [],
    currentProjectIndex: null,
    homeSlidePos: 0,
  },

  async init() {
    // Fetch data
    const res = await fetch('/data.json');
    const data = await res.json();
    this.state.projects = data.projects;

    // Init modules
    Footer.init();
    Transitions.init();
    Home.init(this.state.projects);
    Project.bindScroll();

    // Footer arrow handlers
    Footer.onBack(() => this.exitProject());
    Footer.onNext(() => this.nextProject());

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

    const nextIdx = (this.state.currentProjectIndex + 1) % this.state.projects.length;
    const nextProject = this.state.projects[nextIdx];
    const firstImgSrc = Utils.imgPath(nextProject.slug, 1);

    // Stop current audio
    AudioPlayer.stopAll();

    // Run 8x8 grid transition
    await Transitions.gridTransition(firstImgSrc);

    // Open next project
    this.state.currentProjectIndex = nextIdx;
    Project.open(nextProject, null);

    // Update URL
    history.pushState(null, '', `/project/${nextProject.slug}`);

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
      const idx = App.state.projects.findIndex(p => p.slug === match[1]);
      if (idx >= 0 && App.state.view === 'home') {
        App.enterProject(idx, null);
      }
    }
  }
});

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
