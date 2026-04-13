/* ============================================
   Transitions — 8x8 grid
   ============================================ */

const Transitions = {

  gridEl: null,
  cells: [],

  init() {
    this.gridEl = document.getElementById('grid-transition');

    // Pre-create 64 grid cells
    for (let i = 0; i < 64; i++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      this.gridEl.appendChild(cell);
      this.cells.push(cell);
    }
  },

  // --- 8x8 Grid Transition ---

  // Run the full blackout → reveal transition
  async gridTransition(newFirstImageSrc, onBlackout) {
    const grid = this.gridEl;
    const cells = this.cells;

    // Start preloading image immediately (runs in parallel with blackout)
    const targetImg = new Image();
    targetImg.src = newFirstImageSrc;
    const imgReady = new Promise(r => {
      if (targetImg.complete) return r();
      targetImg.onload = r;
      targetImg.onerror = r;
      setTimeout(r, 3000);
    });

    // Show grid
    grid.classList.add('active');

    // Phase 1: Blackout — cells go black randomly
    const order1 = Utils.shuffle(Utils.range(64));
    await this._staggerCells(order1, cell => {
      cell.style.opacity = '1';
      cell.style.background = '#000';
    }, GRID_STAGGER_MS);

    // Execute callback while screen is fully black (update strip content)
    if (onBlackout) onBlackout();

    // Trigger first strip image load
    const stripImgs = document.querySelectorAll('#strip img[data-src]');
    const firstStripImg = stripImgs[0];
    if (firstStripImg && firstStripImg.dataset.src && !firstStripImg.src) {
      firstStripImg.src = firstStripImg.dataset.src;
    }

    // Wait for preloaded image + minimum pause (whichever is longer)
    const minPause = new Promise(r => setTimeout(r, GRID_PAUSE_MS));
    await Promise.all([imgReady, minPause]);

    // Wait for first strip image to be ready too
    if (firstStripImg && !firstStripImg.complete) {
      await new Promise(r => {
        firstStripImg.addEventListener('load', r, { once: true });
        firstStripImg.addEventListener('error', r, { once: true });
        setTimeout(r, 2000);
      });
    }

    // Ensure browser has painted the strip content before revealing
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

    // Phase 2: Reveal — cells become transparent randomly, showing strip behind
    // Use slower timing for a smoother reveal effect
    cells.forEach(cell => {
      cell.style.transition = `opacity ${GRID_REVEAL_FADE_MS}ms ease`;
    });
    const order2 = Utils.shuffle(Utils.range(64));
    await this._staggerCells(order2, cell => {
      cell.style.opacity = '0';
    }, GRID_REVEAL_STAGGER_MS, GRID_REVEAL_FADE_MS);

    // Clean up
    await new Promise(r => setTimeout(r, GRID_CLEANUP_MS));
    cells.forEach(cell => {
      cell.style.transition = 'none';
      cell.style.opacity = '0';
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
  _staggerCells(order, action, delayMs, fadeMs) {
    fadeMs = fadeMs || GRID_CELL_FADE_MS;
    return new Promise(resolve => {
      order.forEach((idx, step) => {
        setTimeout(() => {
          action(this.cells[idx]);
          if (step === order.length - 1) {
            setTimeout(resolve, fadeMs); // wait for last transition
          }
        }, step * delayMs);
      });
    });
  }
};
