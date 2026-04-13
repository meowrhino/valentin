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
      setTimeout(resolve, TRANSITION_MS);
    });
  },

  // Close mirilla (project → home): bars slide back
  closeMirilla() {
    return new Promise(resolve => {
      this.mirilla.classList.remove('mirilla--open');
      setTimeout(resolve, TRANSITION_MS);
    });
  },

  // Extend mirilla animation until images are ready
  async openMirillaWithLoading(imagesToWait) {
    this.mirilla.classList.add('mirilla--open');

    // Wait for at least the minimum animation time
    const minWait = new Promise(r => setTimeout(r, TRANSITION_MS));

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
  async gridTransition(newFirstImageSrc, onBlackout, fitMode) {
    const grid = this.gridEl;
    const cells = this.cells;

    // Show grid
    grid.classList.add('active');

    // Phase 1: Blackout — cells go black randomly
    const order1 = Utils.shuffle(Utils.range(64));
    await this._staggerCells(order1, cell => {
      cell.style.opacity = '1';
      cell.style.background = '#000';
    }, GRID_STAGGER_MS);

    // Small pause at full black
    await new Promise(r => setTimeout(r, GRID_PAUSE_MS));

    // Execute callback while screen is fully black (update strip content)
    if (onBlackout) onBlackout();

    // Preload the target image so strip has it ready
    const targetImg = new Image();
    targetImg.src = newFirstImageSrc;

    // Trigger first strip image load
    const stripImgs = document.querySelectorAll('#strip img[data-src]');
    const firstStripImg = stripImgs[0];
    if (firstStripImg && firstStripImg.dataset.src && !firstStripImg.src) {
      firstStripImg.src = firstStripImg.dataset.src;
    }

    // Wait for target image to load
    await new Promise(r => {
      if (targetImg.complete) return r();
      targetImg.onload = r;
      targetImg.onerror = r;
      setTimeout(r, 3000);
    });

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
