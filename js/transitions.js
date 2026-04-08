/* ============================================
   Transitions — mirilla open/close, 8x8 grid
   ============================================ */

const Transitions = {

  mirilla: null,
  gridEl: null,
  cells: [],

  init() {
    this.mirilla = document.getElementById('mirilla');
    this.gridEl = document.getElementById('grid-transition');

    // Pre-create 64 grid cells
    for (let i = 0; i < 64; i++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      this.gridEl.appendChild(cell);
      this.cells.push(cell);
    }
  },

  // --- Mirilla ---

  // Open mirilla (home → project): bars slide away
  openMirilla() {
    return new Promise(resolve => {
      this.mirilla.classList.add('mirilla--open');
      setTimeout(resolve, 600);
    });
  },

  // Close mirilla (project → home): bars slide back
  closeMirilla() {
    return new Promise(resolve => {
      this.mirilla.classList.remove('mirilla--open');
      setTimeout(resolve, 600);
    });
  },

  // Extend mirilla animation until images are ready
  async openMirillaWithLoading(imagesToWait) {
    this.mirilla.classList.add('mirilla--open');

    // Wait for at least the minimum animation time
    const minWait = new Promise(r => setTimeout(r, 600));

    // Wait for images to load
    const imgWait = Promise.all(
      imagesToWait.map(img => {
        if (img.complete && img.naturalWidth) return Promise.resolve();
        return new Promise(r => {
          img.addEventListener('load', r, { once: true });
          img.addEventListener('error', r, { once: true });
          // Timeout fallback
          setTimeout(r, 3000);
        });
      })
    );

    await Promise.all([minWait, imgWait]);
  },

  // --- 8x8 Grid Transition ---

  // Run the full blackout → reveal transition
  async gridTransition(newFirstImageSrc) {
    const grid = this.gridEl;
    const cells = this.cells;

    // Show grid
    grid.classList.add('active');

    // Phase 1: Blackout — cells go black randomly
    const order1 = Utils.shuffle(Utils.range(64));
    await this._staggerCells(order1, cell => {
      cell.style.opacity = '1';
      cell.style.backgroundImage = 'none';
      cell.style.background = '#000';
    }, 20);

    // Small pause at full black
    await new Promise(r => setTimeout(r, 200));

    // Preload the target image
    const targetImg = new Image();
    targetImg.src = newFirstImageSrc;
    await new Promise(r => {
      if (targetImg.complete) return r();
      targetImg.onload = r;
      targetImg.onerror = r;
      setTimeout(r, 3000);
    });

    // Set each cell's background to show its portion of the image
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cellW = vw / 8;
    const cellH = vh / 8;

    cells.forEach((cell, i) => {
      const col = i % 8;
      const row = Math.floor(i / 8);
      cell.style.backgroundImage = `url(${newFirstImageSrc})`;
      cell.style.backgroundSize = `${vw}px ${vh}px`;
      cell.style.backgroundPosition = `-${col * cellW}px -${row * cellH}px`;
    });

    // Phase 2: Reveal — cells become transparent randomly
    const order2 = Utils.shuffle(Utils.range(64));
    await this._staggerCells(order2, cell => {
      cell.style.opacity = '0';
    }, 20);

    // Clean up — disable transitions before hiding to prevent ghost flicker
    await new Promise(r => setTimeout(r, 200));
    cells.forEach(cell => {
      cell.style.transition = 'none';
      cell.style.opacity = '0';
      cell.style.backgroundImage = 'none';
      cell.style.background = '#000';
    });
    grid.classList.remove('active');
    // Re-enable transitions after a frame
    requestAnimationFrame(() => {
      cells.forEach(cell => {
        cell.style.transition = '';
      });
    });
  },

  // Stagger an action across cells in a given order
  _staggerCells(order, action, delayMs) {
    return new Promise(resolve => {
      order.forEach((idx, step) => {
        setTimeout(() => {
          action(this.cells[idx]);
          if (step === order.length - 1) {
            setTimeout(resolve, 150); // wait for last transition
          }
        }, step * delayMs);
      });
    });
  }
};
