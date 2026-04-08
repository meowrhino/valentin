/* ============================================
   Audio Player — minimal brutalist player
   ============================================ */

const AudioPlayer = {

  // Create a player element for a slide
  create(src) {
    const audio = document.createElement('audio');
    audio.preload = 'metadata';
    audio.src = src;

    const container = document.createElement('div');
    container.className = 'audio-player';

    // Play/pause button
    const btn = document.createElement('button');
    btn.className = 'audio-player__btn';
    btn.innerHTML = '<div class="audio-player__icon--play"></div>';
    let playing = false;

    btn.addEventListener('click', () => {
      if (playing) {
        audio.pause();
        btn.innerHTML = '<div class="audio-player__icon--play"></div>';
      } else {
        audio.play();
        btn.innerHTML = '<div class="audio-player__icon--pause"><span></span><span></span></div>';
      }
      playing = !playing;
    });

    audio.addEventListener('ended', () => {
      playing = false;
      btn.innerHTML = '<div class="audio-player__icon--play"></div>';
    });

    // Progress bar
    const progress = document.createElement('div');
    progress.className = 'audio-player__progress';
    const fill = document.createElement('div');
    fill.className = 'audio-player__progress-fill';
    progress.appendChild(fill);

    audio.addEventListener('timeupdate', () => {
      if (audio.duration) {
        fill.style.width = (audio.currentTime / audio.duration * 100) + '%';
      }
    });

    progress.addEventListener('click', (e) => {
      const rect = progress.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      audio.currentTime = ratio * audio.duration;
    });

    // Time display
    const time = document.createElement('div');
    time.className = 'audio-player__time';
    time.textContent = '0:00';

    audio.addEventListener('timeupdate', () => {
      time.textContent = Utils.formatTime(audio.currentTime);
    });

    container.appendChild(btn);
    container.appendChild(progress);
    container.appendChild(time);

    // Store audio ref for cleanup
    container._audio = audio;

    return container;
  },

  // Stop all audio players on the page
  stopAll() {
    document.querySelectorAll('.audio-player').forEach(p => {
      if (p._audio) {
        p._audio.pause();
        p._audio.currentTime = 0;
      }
    });
  }
};
