/*
  CONFIG — the knobs that define the composition.
  Edit SEED to get a different (but reproducible) starting layout;
  the same seed always produces the same arrangement.

  cols/rows here are NOT a CSS grid — they're just a virtual
  resolution used once, internally, to work out non-overlapping
  starting positions with real negative space between items.
  Everything renders and drags/resizes as free pixel positioning.
*/
const CONFIG = {
  seed: 3,
  cols: 24,
  rows: 64,
  minColSpan: 2,
  maxColSpan: 3,
  minRowSpan: 2,
  maxRowSpan: 4,
  candidatesPerImage: 50,   // how many random options are compared per item before picking the best
  maxRotate: 0,             // degrees, +/-, for a hand-placed feel (0 to disable). Cleared on manual drag.
  gapPx: 10,                // breathing room between items in the starting layout
  rowUnitPx: 32,            // px height of one virtual row — controls vertical density
  minItemPx: 32,            // floor size when resizing by hand

  // Ambient cycling: every so often, whichever item is currently most
  // "buried" (lowest z-index) gets brought to the front on its own —
  // a slow, unattended reshuffle of who's on top. Pauses automatically
  // while you're dragging or resizing something.
  ambientEnabled: true,
  ambientMinDelayMs: 500,
  ambientMaxDelayMs: 1500,

  // Mixed media list — each entry is either an image or a video.
  // type: "image" | "video". Videos autoplay muted/looped/inline (required
  // for browsers to allow autoplay), and are paused automatically while off-screen.
  media: [
    { type: "image", src: "assets/1.jpeg" },
    { type: "image", src: "assets/6.jpeg" },
    { type: "image", src: "assets/7.jpeg" },
    { type: "image", src: "assets/8.jpeg" },
    { type: "image", src: "assets/9.jpeg" },
    { type: "image", src: "assets/10.jpeg" },
    { type: "image", src: "assets/11.jpeg" },
    { type: "image", src: "assets/12.jpeg" },
    { type: "image", src: "assets/13.jpeg" },
    { type: "image", src: "assets/14.jpeg" },
    { type: "image", src: "assets/15.jpeg" },
    { type: "image", src: "assets/16.jpeg" },
    { type: "image", src: "assets/17.jpeg" },
    { type: "image", src: "assets/18.jpeg" },
    { type: "image", src: "assets/19.jpeg" },
    { type: "image", src: "assets/20.jpeg" },
    { type: "image", src: "assets/21.jpeg" },
    { type: "image", src: "assets/22.jpeg" },
    { type: "image", src: "assets/23.jpeg" },
    { type: "image", src: "assets/24.jpeg" },
    { type: "image", src: "assets/25.jpeg" },
    { type: "image", src: "assets/26.jpeg" },
    { type: "image", src: "assets/27.jpeg" },
    { type: "image", src: "assets/28.jpeg" },
    { type: "image", src: "assets/29.jpeg" },
    { type: "image", src: "assets/30.jpeg" },
    { type: "image", src: "assets/31.jpeg" },
    { type: "image", src: "assets/32.jpeg" },
    { type: "image", src: "assets/33.jpeg" },
    { type: "image", src: "assets/34.jpeg" },
    { type: "image", src: "assets/35.jpeg" },
    { type: "image", src: "assets/36.jpeg" },
    { type: "image", src: "assets/37.jpeg" },
    { type: "image", src: "assets/38.jpeg" },
    { type: "image", src: "assets/39.jpeg" },
    { type: "image", src: "assets/40.jpeg" },
    { type: "image", src: "assets/41.jpeg" },
    { type: "image", src: "assets/42.jpeg" },
    { type: "image", src: "assets/43.jpeg" },
    { type: "image", src: "assets/44.jpeg" },
    { type: "image", src: "assets/45.jpeg" },
    { type: "image", src: "assets/46.jpeg" },
    { type: "image", src: "assets/47.jpeg" },
    { type: "image", src: "assets/48.jpeg" },
    { type: "image", src: "assets/49.jpeg" },
    { type: "image", src: "assets/50.jpeg" },
    { type: "image", src: "assets/51.jpeg" },
    { type: "image", src: "assets/52.jpeg" },
    { type: "image", src: "assets/53.jpeg" },
    { type: "video", src: "assets/1.mov" },
    { type: "video", src: "assets/2.mov" },
    { type: "video", src: "assets/3.mov" },
    { type: "video", src: "assets/4.mov" },
    { type: "video", src: "assets/5.mov" },
    { type: "video", src: "assets/6.mov" },
    { type: "video", src: "assets/7.mov" },
    { type: "video", src: "assets/8.mov" },
    { type: "video", src: "assets/9.mov" },
    { type: "video", src: "assets/10.mov" },
    { type: "video", src: "assets/11.mov" },
    { type: "video", src: "assets/12.mov" },
    { type: "video", src: "assets/13.mov" },
    { type: "video", src: "assets/14.mov" },
    { type: "video", src: "assets/15.mov" },
    { type: "video", src: "assets/16.mov" },
    { type: "video", src: "assets/17.mov" },
    { type: "video", src: "assets/18.mov" },
    { type: "video", src: "assets/19.mov" },
    { type: "video", src: "assets/20.mov" },
    { type: "video", src: "assets/21.mov" },
  ]
};

/* ---------- seeded RNG (mulberry32) ---------- */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function makeRand(seed) {
  const rng = mulberry32(seed);
  return (min, max) => Math.floor(rng() * (max - min + 1)) + min;
}

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

/* ---------- geometry helpers ----------
   containerWidthPx / canvasHeightPx are computed once at init and
   used both for the initial weighted layout and to bound dragging
   and resizing afterward. */
let containerWidthPx = 0;
let canvasHeightPx = 0;

function cellSize() {
  const cellW = containerWidthPx / CONFIG.cols;
  const cellH = CONFIG.rowUnitPx;
  return { cellW, cellH };
}

/* ---------- weighted placement ----------
   For each item, sample several random candidate cell-rects and keep
   the one that overlaps existing items the least — this produces
   good spread with real negative space, rather than pure chance
   piling everything together. rowSpan is derived from the item's
   real aspect ratio and the randomly chosen colSpan, so every item
   starts at (close to) its natural proportions. The winning cell-rect
   is then converted to a plain pixel rect (left/top/width/height) —
   from this point on there is no grid, just absolute positioning. */
function weightedLayout(seed, aspectRatios) {
  const rand = makeRand(seed);
  const { cols, rows, minColSpan, maxColSpan, minRowSpan, maxRowSpan, candidatesPerImage, media, maxRotate, gapPx } = CONFIG;
  const { cellW, cellH } = cellSize();

  const coverage = Array.from({ length: rows }, () => Array(cols).fill(0));
  const placements = [];

  media.forEach(({ src, type }, i) => {
    const ratio = aspectRatios[i] || 4 / 3; // width / height, fallback if load failed
    let best = null;
    let bestScore = Infinity;

    for (let c = 0; c < candidatesPerImage; c++) {
      const colSpan = rand(minColSpan, maxColSpan);
      const idealRowSpan = Math.round((colSpan * cellW) / ratio / cellH);
      const rowSpan = clamp(idealRowSpan, minRowSpan, maxRowSpan);

      const colStart = rand(1, Math.max(1, cols - colSpan + 1));
      const rowStart = rand(1, Math.max(1, rows - rowSpan + 1));

      let overlap = 0;
      for (let r = rowStart - 1; r < rowStart - 1 + rowSpan; r++) {
        for (let cc = colStart - 1; cc < colStart - 1 + colSpan; cc++) {
          overlap += coverage[r][cc];
        }
      }
      // overlap is penalized heavily so the algorithm strongly prefers
      // untouched cells (negative space) over stacking on existing items;
      // it will still overlap if every candidate spot is occupied.
      const score = overlap * 25 - (colSpan * rowSpan) * 0.01;

      if (score < bestScore) {
        bestScore = score;
        best = { colStart, rowStart, colSpan, rowSpan };
      }
    }

    for (let r = best.rowStart - 1; r < best.rowStart - 1 + best.rowSpan; r++) {
      for (let cc = best.colStart - 1; cc < best.colStart - 1 + best.colSpan; cc++) {
        coverage[r][cc] += 1;
      }
    }

    const rotate = maxRotate ? (rand(-maxRotate * 10, maxRotate * 10) / 10) : 0;

    // convert the winning cell-rect into a plain pixel rect
    const left = (best.colStart - 1) * cellW + gapPx / 2;
    const top = (best.rowStart - 1) * cellH + gapPx / 2;
    const width = best.colSpan * cellW - gapPx;
    const height = best.rowSpan * cellH - gapPx;

    placements.push({ src, type, left, top, width, height, rotate, scale: 1, ratio, z: i + 1 });
  });

  return placements;
}

/* ---------- preload natural aspect ratio for each media item ---------- */
function getAspectRatio(entry) {
  return new Promise((resolve) => {
    if (entry.type === 'video') {
      const v = document.createElement('video');
      v.preload = 'metadata';
      v.muted = true;
      v.src = entry.src;
      v.addEventListener('loadedmetadata', () => {
        resolve(v.videoWidth && v.videoHeight ? v.videoWidth / v.videoHeight : 4 / 3);
      });
      v.addEventListener('error', () => resolve(4 / 3));
    } else {
      const img = new Image();
      img.onload = () => resolve(img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 4 / 3);
      img.onerror = () => resolve(4 / 3);
      img.src = entry.src;
    }
  });
}

/* ---------- render + interaction ---------- */
const el = document.getElementById('composition');

let state = [];
let itemEls = [];
let topZ = CONFIG.media.length;
let isInteracting = false;

const videoObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const vid = entry.target;
    if (entry.isIntersecting) {
      vid.play().catch(() => {}); // ignore autoplay rejections
    } else {
      vid.pause();
    }
  });
}, { threshold: 0.1 });

function render() {
  el.innerHTML = '';
  itemEls = [];
  state.forEach((p, idx) => {
    const item = document.createElement('div');
    item.className = 'item';
    item.dataset.index = idx;
    applyStyle(item, p);

    let mediaEl;
    if (p.type === 'video') {
      mediaEl = document.createElement('video');
      mediaEl.src = p.src;
      mediaEl.muted = true;
      mediaEl.loop = true;
      mediaEl.playsInline = true;
      mediaEl.autoplay = true;
      mediaEl.preload = 'metadata';
      // controls intentionally omitted — native scrubber would fight with drag
      videoObserver.observe(mediaEl);
    } else {
      mediaEl = document.createElement('img');
      mediaEl.src = p.src;
      mediaEl.alt = '';
    }
    item.appendChild(mediaEl);

    const handle = document.createElement('div');
    handle.className = 'resize-handle';
    item.appendChild(handle);

    el.appendChild(item);
    itemEls.push(item);
    wireInteractions(item, handle, p);
  });
}

function applyStyle(item, p) {
  item.style.left = `${p.left}px`;
  item.style.top = `${p.top}px`;
  item.style.width = `${p.width}px`;
  item.style.height = `${p.height}px`;
  item.style.zIndex = p.z;
  item.style.transform = `rotate(${p.rotate}deg) scale(${p.scale || 1})`;
}

function bringToFront(p) {
  topZ += 1;
  p.z = topZ;
}

function wireInteractions(item, handle, p) {
  // ---- drag to move — smooth, unsnapped pixel movement ----
  item.addEventListener('pointerdown', (e) => {
    if (e.target === handle) return; // let resize handle own its own drag
    e.preventDefault();
    item.setPointerCapture(e.pointerId);
    item.classList.add('dragging');
    isInteracting = true;
    bringToFront(p);
    p.rotate = 0; // straighten once the user takes manual control
    applyStyle(item, p);

    const startX = e.clientX, startY = e.clientY;
    const startLeft = p.left, startTop = p.top;

    function onMove(ev) {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      p.left = clamp(startLeft + dx, 0, containerWidthPx - p.width);
      p.top = clamp(startTop + dy, 0, canvasHeightPx - p.height);
      applyStyle(item, p);
    }
    function onUp() {
      item.classList.remove('dragging');
      isInteracting = false;
      item.removeEventListener('pointermove', onMove);
      item.removeEventListener('pointerup', onUp);
    }
    item.addEventListener('pointermove', onMove);
    item.addEventListener('pointerup', onUp);
  });

  // ---- drag to resize — smooth, unsnapped pixel resizing ----
  handle.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    handle.setPointerCapture(e.pointerId);
    isInteracting = true;
    bringToFront(p);
    applyStyle(item, p);

    const startX = e.clientX, startY = e.clientY;
    const startWidth = p.width;
    const ratio = p.ratio || (p.width / p.height); // width / height, kept constant while resizing

    function onMove(ev) {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      // drive size off whichever axis moved further, but always derive
      // the other dimension from it so the aspect ratio never changes
      const driveByWidth = Math.abs(dx) >= Math.abs(dy);

      const maxWidth = containerWidthPx - p.left;
      const maxHeight = canvasHeightPx - p.top;

      let newWidth;
      if (driveByWidth) {
        newWidth = clamp(startWidth + dx, CONFIG.minItemPx, maxWidth);
      } else {
        const startHeight = startWidth / ratio;
        const newHeight = clamp(startHeight + dy, CONFIG.minItemPx, maxHeight);
        newWidth = newHeight * ratio;
      }

      let newHeight = newWidth / ratio;

      // if the derived height overflows the canvas, shrink both
      // dimensions together so the ratio still holds exactly
      if (newHeight > maxHeight) {
        newHeight = maxHeight;
        newWidth = newHeight * ratio;
      }
      if (newWidth > maxWidth) {
        newWidth = maxWidth;
        newHeight = newWidth / ratio;
      }

      p.width = newWidth;
      p.height = newHeight;
      applyStyle(item, p);
    }
    function onUp() {
      isInteracting = false;
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);
    }
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
  });
}

async function init() {
  containerWidthPx = el.getBoundingClientRect().width;
  canvasHeightPx = CONFIG.rows * CONFIG.rowUnitPx;
  el.style.height = `${canvasHeightPx}px`;

  const aspectRatios = await Promise.all(CONFIG.media.map(getAspectRatio));
  state = weightedLayout(CONFIG.seed, aspectRatios);
  render();

  if (CONFIG.ambientEnabled) scheduleAmbientPulse();
}

/* ---------- ambient cycling ----------
   Leisurely, unattended reshuffling of stacking order: every couple
   of seconds, a random item rises to the front on its own. Skips a
   beat rather than fighting the user if something is actively being
   dragged or resized. */
function promoteRandomItem() {
  if (state.length < 2) return;

  const idx = Math.floor(Math.random() * state.length);
  const p = state[idx];
  const item = itemEls[idx];
  if (!item) return;

  bringToFront(p);
  p.scale = 1.03;
  applyStyle(item, p);
  item.classList.add('pulsing');

  setTimeout(() => {
    p.scale = 1;
    applyStyle(item, p);
    item.classList.remove('pulsing');
  }, 650);
}

function scheduleAmbientPulse() {
  const delay = CONFIG.ambientMinDelayMs +
    Math.random() * (CONFIG.ambientMaxDelayMs - CONFIG.ambientMinDelayMs);
  setTimeout(() => {
    if (!isInteracting) promoteRandomItem();
    scheduleAmbientPulse();
  }, delay);
}

init();
