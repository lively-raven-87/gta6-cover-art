// Vice Cover Lab — wires the editor: panel slots, caption, grade, sizes, export.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).
// Classic scripts (poster.js and shots.js load first); no modules, so the app
// also opens straight from its files with no server at all.
const canvas = document.getElementById('cover');
const captionInput = document.getElementById('caption');
const subtitleInput = document.getElementById('subtitle');
const gradeSelect = document.getElementById('grade');
const sizeSelect = document.getElementById('size');
const panelsBox = document.getElementById('panels');
const statusLine = document.getElementById('status');

const DEFAULT_SAMPLES = ['pier', 'boulevard', 'boulevard', 'pier'];

/** One panel slot: its photo, zoom and pan. `img` starts as null. */
function emptyPanel(sample) {
  return { img: null, sample, zoom: 1.15, panX: 0, panY: 0 };
}

const state = {
  panelCount: 2,
  panels: [emptyPanel('pier'), emptyPanel('boulevard'), emptyPanel('boulevard'), emptyPanel('pier')],
  caption: 'VICE CITY',
  subtitle: 'SUNSET HEIST',
  grade: 'sunset',
  size: 'square',
};

function visiblePanels() {
  return state.panels.slice(0, state.panelCount);
}

/** Loads an image from a URL, resolving once it can be drawn. */
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function redraw() {
  const { w, h } = SIZES[state.size];
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  drawPoster(canvas, {
    panels: visiblePanels(),
    caption: state.caption,
    subtitle: state.subtitle,
    grade: state.grade,
  });
}

function setStatus(text) {
  statusLine.textContent = text;
}

function sampleUrl(name) {
  return `samples/${name}.jpg`;
}

/** Builds the control card for one panel slot (file, sample, zoom, pan). */
function buildPanelCard(index) {
  const panel = state.panels[index];
  const card = document.createElement('section');
  card.className = 'panel-card';
  card.innerHTML = `
    <h3>Panel ${index + 1}</h3>
    <img class="thumb" alt="Panel ${index + 1} photo">
    <label>Your photo <input type="file" accept="image/*"></label>
    <label>Or a sample
      <select>
        <option value="">No photo</option>
        ${SAMPLES.map((s) => `<option value="${s}">${s === 'pier' ? 'Pier fisherman' : 'Boulevard sunset'}</option>`).join('')}
      </select>
    </label>
    <label>Zoom <input type="range" min="1" max="2" step="0.01" value="${panel.zoom}"></label>
    <label>Pan left–right <input type="range" min="-1" max="1" step="0.01" value="${panel.panX}"></label>
    <label>Pan up–down <input type="range" min="-1" max="1" step="0.01" value="${panel.panY}"></label>
  `;
  const thumb = card.querySelector('.thumb');
  const fileInput = card.querySelector('input[type=file]');
  const sampleSelect = card.querySelector('select');
  const [zoomInput, panXInput, panYInput] = card.querySelectorAll('input[type=range]');
  sampleSelect.value = panel.sample || '';

  const showThumb = () => {
    thumb.src = panel.img ? panel.img.src : '';
    thumb.style.visibility = panel.img ? 'visible' : 'hidden';
  };

  fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    panel.img = await loadImage(URL.createObjectURL(file));
    panel.sample = '';
    sampleSelect.value = '';
    showThumb();
    redraw();
    setStatus(`Panel ${index + 1}: loaded ${file.name}.`);
  });
  sampleSelect.addEventListener('change', async () => {
    panel.sample = sampleSelect.value;
    panel.img = panel.sample ? await loadImage(sampleUrl(panel.sample)) : null;
    showThumb();
    redraw();
  });
  zoomInput.addEventListener('input', () => { panel.zoom = Number(zoomInput.value); redraw(); });
  panXInput.addEventListener('input', () => { panel.panX = Number(panXInput.value); redraw(); });
  panYInput.addEventListener('input', () => { panel.panY = Number(panYInput.value); redraw(); });
  showThumb();
  return card;
}

function rebuildPanelCards() {
  panelsBox.replaceChildren(...visiblePanels().map((_, i) => buildPanelCard(i)));
}

document.querySelectorAll('input[name=panels]').forEach((radio) => {
  radio.addEventListener('change', () => {
    state.panelCount = Number(radio.value);
    rebuildPanelCards();
    redraw();
  });
});
captionInput.addEventListener('input', () => { state.caption = captionInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });
gradeSelect.addEventListener('change', () => { state.grade = gradeSelect.value; redraw(); });
sizeSelect.addEventListener('change', () => { state.size = sizeSelect.value; redraw(); });

function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

function renderSize(key) {
  const { w, h } = SIZES[key];
  const offscreen = document.createElement('canvas');
  offscreen.width = w;
  offscreen.height = h;
  drawPoster(offscreen, {
    panels: visiblePanels(),
    caption: state.caption,
    subtitle: state.subtitle,
    grade: state.grade,
  });
  return new Promise((resolve) => {
    offscreen.toBlob((blob) => {
      downloadBlob(blob, `vice-cover-${key}-${w}x${h}.png`);
      resolve();
    }, 'image/png');
  });
}

document.getElementById('export-one').addEventListener('click', async () => {
  await renderSize(state.size);
  const { w, h } = SIZES[state.size];
  setStatus(`Saved vice-cover-${state.size}-${w}x${h}.png.`);
});

document.getElementById('export-all').addEventListener('click', async () => {
  setStatus('Exporting all four sizes…');
  for (const key of Object.keys(SIZES)) {
    await renderSize(key);
    await new Promise((r) => setTimeout(r, 200));
  }
  setStatus('Saved all four sizes: 1080x1080, 1080x1350, 1080x1920, 1920x1080.');
});

/** Applies a `?shot=` scene: panels, caption, grade and size from the query. */
async function applyShot(query) {
  const panels = Math.min(4, Math.max(2, Number(query.get('panels') ?? 2) || 2));
  state.panelCount = panels;
  state.caption = query.get('caption') ?? 'VICE CITY';
  state.subtitle = query.get('sub') ?? 'SUNSET HEIST';
  state.grade = query.get('grade') ?? 'sunset';
  state.size = SIZES[query.get('size')] ? query.get('size') : 'square';
  captionInput.value = state.caption;
  subtitleInput.value = state.subtitle;
  gradeSelect.value = state.grade;
  sizeSelect.value = state.size;
  document.querySelector(`input[name=panels][value="${panels}"]`).checked = true;
  for (let i = 0; i < panels; i++) {
    const sample = query.get(`p${i + 1}`) ?? DEFAULT_SAMPLES[i];
    state.panels[i].sample = sample;
    state.panels[i].img = await loadImage(sampleUrl(sample));
    // Optional per-panel pan for a shot: x1..x4 and y1..y4, -1 to 1.
    const px = Number(query.get(`x${i + 1}`));
    const py = Number(query.get(`y${i + 1}`));
    if (Number.isFinite(px)) state.panels[i].panX = px;
    if (Number.isFinite(py)) state.panels[i].panY = py;
  }
  rebuildPanelCards();
  redraw();
}

async function loadDefaults() {
  for (let i = 0; i < state.panelCount; i++) {
    state.panels[i].img = await loadImage(sampleUrl(DEFAULT_SAMPLES[i]));
  }
  rebuildPanelCards();
  redraw();
  setStatus('Samples loaded — pick your own photos per panel to start.');
}

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, applyShot);
} else {
  loadDefaults();
}
