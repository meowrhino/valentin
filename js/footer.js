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
    const p = this._currentProject;
    if (!p) return;

    let html = '';
    if (p.descripcion) html += `<p>${p.descripcion}</p>`;
    if (p.lugar) html += `<p><span class="lengueta__label">Location</span> ${p.lugar}</p>`;
    if (p.fecha) html += `<p><span class="lengueta__label">Date</span> ${p.fecha}</p>`;
    if (p.fichaTecnica && p.fichaTecnica.length) {
      html += `<p><span class="lengueta__label">Type</span> ${p.fichaTecnica.join(', ')}</p>`;
    }
    if (p.team && p.team.length) {
      const teamHtml = p.team.map(([name, url]) =>
        url ? `<a href="${url}" target="_blank">${name}</a>` : name
      ).join(', ');
      html += `<p><span class="lengueta__label">Team</span> ${teamHtml}</p>`;
    }

    if (!html) html = '<p>No info yet</p>';

    this.els.lenguetaContent.innerHTML = html;
    this.els.lengueta.classList.remove('hidden');
    this.lenguetaOpen = true;
  },

  closeLengueta() {
    this.els.lengueta.classList.add('hidden');
    this.lenguetaOpen = false;
  },

  // Switch to project footer mode with marquee
  showProject(name) {
    document.body.classList.add('view-project');
    // Fill marquee with repeated text (need 2x for seamless loop)
    const repeated = (name + ' \u00B7 ').repeat(20);
    this.els.marquee.innerHTML = `<span>${repeated}</span><span>${repeated}</span>`;
  },

  // Switch back to home footer mode
  showHome() {
    document.body.classList.remove('view-project');
  },

  // Update switch icon based on mode
  // ☉ (U+2609, sun with dot) = go to personal
  // ○ (U+25CB, circle) = go to commercial
  updateSwitchIcon(currentMode) {
    if (currentMode === 'commercial') {
      this.els.switchBtn.textContent = '\u2609'; // sun = click to go personal
      this.els.switchBtn.title = 'personal';
    } else {
      this.els.switchBtn.textContent = '\u25CB'; // circle = click to go commercial
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
