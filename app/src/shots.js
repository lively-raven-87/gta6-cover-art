// Fixed scenes for screenshots: ?shot=editor shows the editor with photos loaded;
// ?shot=cover shows the finished cover alone. The query picks the panel count,
// one sample per panel (p1..p4), the caption, the subtitle, the grade and the
// export size. window.__shotReady is set once the scene has painted.
async function runShot(shot, query, apply) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  if (shot === 'editor') document.body.classList.add('shot-editor');
  await apply(query);
  // Let the page font settle before the screenshot is taken.
  if (document.fonts?.ready) await document.fonts.ready;
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
