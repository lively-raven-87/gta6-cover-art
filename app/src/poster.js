// Vice Cover Lab — the poster painter.
//
// One canvas, one state object: a set of photo panels in the GTA loading-screen
// manner (a diagonal split for two photos, a hero panel plus a stacked pair for
// three, a 2x2 grid for four), a neon-sunset colour grade over the top, and bold
// slanted caption lettering with a subtitle pill. Everything is drawn with the
// canvas 2D API, so the app needs no library and no network.

const SIZES = {
  square: { w: 1080, h: 1080, label: 'Square 1080 x 1080' },
  portrait: { w: 1080, h: 1350, label: 'Portrait 1080 x 1350' },
  story: { w: 1080, h: 1920, label: 'Story 1080 x 1920' },
  wide: { w: 1920, h: 1080, label: 'Wide 1920 x 1080' },
};

const SAMPLES = ['pier', 'boulevard'];

const GRADES = {
  sunset: {
    top: 'rgba(255, 122, 26, 0.22)',
    bottom: 'rgba(255, 45, 120, 0.34)',
    sun: 'rgba(255, 205, 100, 0.55)',
    vignette: 0.38,
  },
  neon: {
    top: 'rgba(0, 229, 255, 0.22)',
    bottom: 'rgba(255, 45, 120, 0.32)',
    sun: 'rgba(0, 229, 255, 0.45)',
    vignette: 0.38,
  },
  noir: {
    top: 'rgba(120, 120, 150, 0.10)',
    bottom: 'rgba(10, 4, 24, 0.30)',
    sun: null,
    vignette: 0.55,
  },
};

const BACKDROP = '#160a24';
const GUTTER = '#f5f0fa';

/** The polygon (list of [x, y] corners) of one panel in a layout of `count`. */
function panelPolygon(count, index, w, h) {
  if (count === 2) {
    const top = w * 0.58;
    const bottom = w * 0.42;
    return index === 0
      ? [[0, 0], [top, 0], [bottom, h], [0, h]]
      : [[top, 0], [w, 0], [w, h], [bottom, h]];
  }
  if (count === 3) {
    const split = w * 0.6;
    const mid = h * 0.5;
    if (index === 0) return [[0, 0], [split, 0], [split, h], [0, h]];
    if (index === 1) return [[split, 0], [w, 0], [w, mid], [split, mid]];
    return [[split, mid], [w, mid], [w, h], [split, h]];
  }
  // Four panels: a 2x2 grid with a gutter between the cells.
  const gap = 8;
  const cw = (w - gap) / 2;
  const ch = (h - gap) / 2;
  const x = index % 2 === 0 ? 0 : cw + gap;
  const y = index < 2 ? 0 : ch + gap;
  return [[x, y], [x + cw, y], [x + cw, y + ch], [x, y + ch]];
}

function polygonBounds(poly) {
  const xs = poly.map((p) => p[0]);
  const ys = poly.map((p) => p[1]);
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    w: Math.max(...xs) - Math.min(...xs),
    h: Math.max(...ys) - Math.min(...ys),
  };
}

function trace(ctx, poly) {
  ctx.beginPath();
  ctx.moveTo(poly[0][0], poly[0][1]);
  for (const [x, y] of poly.slice(1)) ctx.lineTo(x, y);
  ctx.closePath();
}

/** Fills one panel with its photo, cover-fit, zoomed and panned by the panel. */
function paintPanel(ctx, poly, panel) {
  const box = polygonBounds(poly);
  ctx.save();
  trace(ctx, poly);
  ctx.clip();
  if (panel.img) {
    const base = Math.max(box.w / panel.img.naturalWidth, box.h / panel.img.naturalHeight);
    const scale = base * (panel.zoom || 1);
    const dw = panel.img.naturalWidth * scale;
    const dh = panel.img.naturalHeight * scale;
    const cx = box.x + box.w / 2 + (panel.panX || 0) * box.w * 0.25;
    const cy = box.y + box.h / 2 + (panel.panY || 0) * box.h * 0.25;
    ctx.drawImage(panel.img, cx - dw / 2, cy - dh / 2, dw, dh);
  } else {
    ctx.fillStyle = '#3a2350';
    ctx.fillRect(box.x, box.y, box.w, box.h);
  }
  ctx.restore();
}

/** The neon-sunset (or neon / noir) grade over the whole poster. */
function applyGrade(ctx, w, h, gradeName) {
  const grade = GRADES[gradeName] ?? GRADES.sunset;
  if (gradeName === 'noir') {
    ctx.save();
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = 'rgba(128, 128, 128, 0.6)';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
  if (grade.sun) {
    const glow = ctx.createRadialGradient(w * 0.76, h * 0.16, 0, w * 0.76, h * 0.16, w * 0.22);
    glow.addColorStop(0, grade.sun);
    glow.addColorStop(1, 'rgba(255, 205, 100, 0)');
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
  const wash = ctx.createLinearGradient(0, 0, 0, h);
  wash.addColorStop(0, grade.top);
  wash.addColorStop(1, grade.bottom);
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  // Darken the edges and the foot so the lettering always reads.
  const shade = ctx.createLinearGradient(0, h * 0.55, 0, h);
  shade.addColorStop(0, 'rgba(10, 4, 20, 0)');
  shade.addColorStop(1, `rgba(10, 4, 20, ${grade.vignette + 0.2})`);
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, w, h);
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fitLines(ctx, text, maxWidth, startSize) {
  let size = startSize;
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  while (size > 20) {
    ctx.font = `italic 900 ${size}px "Arial Black", "Segoe UI", sans-serif`;
    lines.length = 0;
    let current = '';
    for (const word of words) {
      const trial = current ? `${current} ${word}` : word;
      if (ctx.measureText(trial).width <= maxWidth || !current) current = trial;
      else {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
    // Leave room for the outline stroke on both sides, not just the fill.
    const stroked = (l) => ctx.measureText(l).width + size * 0.18;
    if (lines.length <= 2 && lines.every((l) => stroked(l) <= maxWidth)) break;
    size -= 4;
  }
  return { lines, size };
}

/** The bold slanted caption and its subtitle pill across the foot. */
function letterCaption(ctx, w, h, caption, subtitle) {
  const words = (caption || '').trim().toUpperCase();
  const sub = (subtitle || '').trim().toUpperCase();
  const unit = Math.min(w, h);
  if (sub) {
    const pillSize = Math.round(unit * 0.032);
    ctx.font = `800 ${pillSize}px "Segoe UI", sans-serif`;
    try { ctx.letterSpacing = `${Math.round(pillSize * 0.25)}px`; } catch { /* older canvas */ }
    const textW = ctx.measureText(sub).width;
    const pw = textW + pillSize * 1.6;
    const ph = pillSize * 2.1;
    const px = (w - pw) / 2;
    const py = h * 0.68;
    ctx.fillStyle = '#ff2d78';
    roundRectPath(ctx, px, py, pw, ph, ph / 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sub, w / 2, py + ph / 2 + 1);
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  }
  if (!words) return;
  const { lines, size } = fitLines(ctx, words, w * 0.88, Math.round(unit * 0.105));
  const lineHeight = size * 1.02;
  const total = lines.length * lineHeight;
  const blockCenterY = h * 0.9 - size * 0.14;
  let y = h * 0.9 - total / 2 + size * 0.36;
  ctx.save();
  // Slant around the caption block's own centre, so the shear never shoves
  // the whole title sideways (a shear about the origin would).
  ctx.translate(w / 2, blockCenterY);
  ctx.transform(1, 0, -0.07, 1, 0, 0);
  ctx.translate(-w / 2, -blockCenterY);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  for (const line of lines) {
    ctx.font = `italic 900 ${size}px "Arial Black", "Segoe UI", sans-serif`;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#12081f';
    ctx.lineWidth = size * 0.16;
    ctx.shadowColor = 'rgba(255, 45, 120, 0.85)';
    ctx.shadowBlur = size * 0.12;
    ctx.shadowOffsetX = size * 0.03;
    ctx.shadowOffsetY = size * 0.05;
    const fill = ctx.createLinearGradient(0, y - size, 0, y);
    fill.addColorStop(0, '#ffffff');
    fill.addColorStop(1, '#ffd166');
    ctx.strokeText(line, w / 2, y);
    ctx.fillStyle = fill;
    ctx.fillText(line, w / 2, y);
    y += lineHeight;
  }
  ctx.restore();
}

/**
 * Draws the whole poster onto `canvas` (which must already be sized to the
 * wanted export size). `state` holds panels, caption, subtitle and grade.
 */
function drawPoster(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = BACKDROP;
  ctx.fillRect(0, 0, w, h);
  const count = state.panels.length;
  state.panels.forEach((panel, i) => {
    paintPanel(ctx, panelPolygon(count, i, w, h), panel);
  });
  // Crisp gutters: a white seam along the shared edges.
  ctx.strokeStyle = GUTTER;
  ctx.lineWidth = Math.max(4, w * 0.006);
  if (count === 2) {
    ctx.beginPath();
    ctx.moveTo(w * 0.58, 0);
    ctx.lineTo(w * 0.42, h);
    ctx.stroke();
  } else if (count === 3) {
    ctx.beginPath();
    ctx.moveTo(w * 0.6, 0);
    ctx.lineTo(w * 0.6, h);
    ctx.moveTo(w * 0.6, h * 0.5);
    ctx.lineTo(w, h * 0.5);
    ctx.stroke();
  } else {
    // Four panels: a thin white seam around each cell, over the gutter.
    const gap = 8;
    const cw = (w - gap) / 2;
    const ch = (h - gap) / 2;
    ctx.lineWidth = Math.max(2, w * 0.002);
    for (let i = 0; i < 4; i++) {
      const x = i % 2 === 0 ? 0 : cw + gap;
      const y = i < 2 ? 0 : ch + gap;
      ctx.strokeRect(x, y, cw, ch);
    }
  }
  applyGrade(ctx, w, h, state.grade);
  // Neon frame: white outer line, magenta inner line.
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(6, w * 0.008);
  ctx.strokeRect(4, 4, w - 8, h - 8);
  ctx.strokeStyle = '#ff2d78';
  ctx.lineWidth = Math.max(2, w * 0.002);
  ctx.strokeRect(16, 16, w - 32, h - 32);
  // App badge, top left.
  const badgeSize = Math.round(Math.min(w, h) * 0.024);
  ctx.font = `800 ${badgeSize}px "Segoe UI", sans-serif`;
  const badgeText = 'VICE COVER LAB';
  const bw = ctx.measureText(badgeText).width + badgeSize * 1.4;
  const bh = badgeSize * 2;
  ctx.fillStyle = 'rgba(18, 8, 31, 0.75)';
  roundRectPath(ctx, 28, 28, bw, bh, bh / 2);
  ctx.fill();
  ctx.fillStyle = '#00e5ff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeText, 28 + badgeSize * 0.7, 28 + bh / 2 + 1);
  letterCaption(ctx, w, h, state.caption, state.subtitle);
}
