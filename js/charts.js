// Grafieken als inline SVG. Geen externe libraries: scheelt een build-stap
// en werkt op GitHub Pages zonder verdere configuratie.

const NS = 'http://www.w3.org/2000/svg';
const el = (naam, attrs = {}) => {
  const n = document.createElementNS(NS, naam);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
};

const W = 640, H = 220, PAD = { t: 16, r: 16, b: 28, l: 44 };

function assen(svg, xLabels, yMin, yMax) {
  const bx = PAD.l, by = H - PAD.b, bw = W - PAD.l - PAD.r, bh = H - PAD.t - PAD.b;
  svg.append(el('line', { x1: bx, y1: by, x2: bx + bw, y2: by, class: 'as' }));
  svg.append(el('line', { x1: bx, y1: PAD.t, x2: bx, y2: by, class: 'as' }));

  for (let i = 0; i <= 4; i++) {
    const y = by - (bh * i) / 4;
    const waarde = yMin + ((yMax - yMin) * i) / 4;
    svg.append(el('line', { x1: bx, y1: y, x2: bx + bw, y2: y, class: 'raster' }));
    const t = el('text', { x: bx - 6, y: y + 4, class: 'aslabel', 'text-anchor': 'end' });
    t.textContent = Math.round(waarde);
    svg.append(t);
  }
  const stap = Math.ceil(xLabels.length / 6) || 1;
  xLabels.forEach((lab, i) => {
    if (i % stap !== 0 && i !== xLabels.length - 1) return;
    const x = bx + (bw * i) / Math.max(1, xLabels.length - 1);
    const t = el('text', { x, y: by + 18, class: 'aslabel', 'text-anchor': 'middle' });
    t.textContent = lab;
    svg.append(t);
  });
  return { bx, by, bw, bh };
}

const schaal = (waarden) => {
  const min = Math.min(...waarden), max = Math.max(...waarden);
  if (min === max) return [Math.max(0, min - 1), max + 1];
  const marge = (max - min) * 0.15;
  return [Math.max(0, min - marge), max + marge];
};

/** Lijngrafiek met punten, bv. geschat 1RM per datum. */
export function lijn(punten, { eenheid = 'kg' } = {}) {
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'grafiek', role: 'img' });
  if (punten.length === 0) return leegSvg('Nog geen data');

  const waarden = punten.map(p => p.y);
  const [yMin, yMax] = schaal(waarden);
  const { bx, by, bw, bh } = assen(svg, punten.map(p => p.x), yMin, yMax);
  const px = i => bx + (bw * i) / Math.max(1, punten.length - 1);
  const py = v => by - (bh * (v - yMin)) / (yMax - yMin || 1);

  const d = punten.map((p, i) => `${i ? 'L' : 'M'}${px(i).toFixed(1)},${py(p.y).toFixed(1)}`).join(' ');
  const vlak = `${d} L${px(punten.length - 1)},${by} L${bx},${by} Z`;
  svg.append(el('path', { d: vlak, class: 'vlak' }));
  svg.append(el('path', { d, class: 'lijn' }));

  punten.forEach((p, i) => {
    const c = el('circle', { cx: px(i), cy: py(p.y), r: 3.5, class: 'punt' });
    const titel = el('title');
    titel.textContent = `${p.x}: ${Math.round(p.y * 10) / 10} ${eenheid}`;
    c.append(titel);
    svg.append(c);
  });
  return svg;
}

/** Staafgrafiek met streeflijn, bv. trainingen per week tegen de streeffrequentie. */
export function staven(rijen, { streef = null } = {}) {
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'grafiek', role: 'img' });
  if (rijen.length === 0) return leegSvg('Nog geen data');

  const yMax = Math.max(streef ?? 0, ...rijen.map(r => r.y)) + 1;
  const { bx, by, bw, bh } = assen(svg, rijen.map(r => r.x), 0, yMax);
  const breedte = (bw / rijen.length) * 0.6;

  rijen.forEach((r, i) => {
    const x = bx + (bw * (i + 0.5)) / rijen.length - breedte / 2;
    const h = (bh * r.y) / yMax;
    const rect = el('rect', {
      x, y: by - h, width: breedte, height: Math.max(0, h),
      rx: 3, class: streef && r.y >= streef ? 'staaf goed' : 'staaf',
    });
    const titel = el('title');
    titel.textContent = `${r.x}: ${r.y}${streef ? ` van ${streef}` : ''}`;
    rect.append(titel);
    svg.append(rect);
  });

  if (streef) {
    const y = by - (bh * streef) / yMax;
    svg.append(el('line', { x1: bx, y1: y, x2: bx + bw, y2: y, class: 'streeflijn' }));
  }
  return svg;
}

function leegSvg(tekst) {
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'grafiek' });
  const t = el('text', { x: W / 2, y: H / 2, class: 'leeg', 'text-anchor': 'middle' });
  t.textContent = tekst;
  svg.append(t);
  return svg;
}
