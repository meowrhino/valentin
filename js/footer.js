/* ============================================
   Footer — home/project modes, marquee
   ============================================ */

const Footer = {

  els: {},

  init() {
    this.els.home = document.getElementById('footer-home');
    this.els.project = document.getElementById('footer-project');
    this.els.projectName = document.getElementById('footer-project-name');
    this.els.marquee = document.getElementById('marquee-text');
    this.els.btnBack = document.getElementById('btn-back');
    this.els.btnNext = document.getElementById('btn-next');
  },

  // Update the project name shown in home footer center
  setHomeName(name) {
    this.els.projectName.textContent = name;
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

  // Bind arrow callbacks
  onBack(fn) {
    this.els.btnBack.addEventListener('click', fn);
  },

  onNext(fn) {
    this.els.btnNext.addEventListener('click', fn);
  }
};
