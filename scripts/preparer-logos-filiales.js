#!/usr/bin/env node
/**
 * Prépare les logos des filiales pour la bande « Nos filiales » :
 *  - fond blanc opaque rendu transparent (remplissage depuis les bords, bord adouci),
 *  - marges coupées au plus près du dessin,
 *  - taille « optique » : chaque logo occupe la même surface visuelle (≈ 8 000 px²),
 *    plafonnée à 200 × 80 px (réduite pour les logos très pleins), exportée au double pour les écrans haute densité.
 * Sans dépendance : ffmpeg décode et encode, le traitement se fait en JavaScript.
 *
 * Usage : node scripts/preparer-logos-filiales.js
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const GOC = path.join(__dirname, '..', '..');
const LOGOS = path.join(GOC, 'Img', 'Inspiration images', 'Logo Partenaire');
const SITE = path.join(GOC, 'gaboil', 'public', 'images', 'subsidiaries');
const DST = path.join(__dirname, '..', 'img', 'filiales');

const SOURCES = [
  { nom: 'assala', fichier: path.join(LOGOS, 'assala.png'), fondBlanc: true },
  { nom: 'gop', fichier: path.join(LOGOS, 'gop.png') },
  { nom: 'addax', fichier: path.join(SITE, 'addax1.png') },
  { nom: 'smp', fichier: path.join(LOGOS, 'smp.png'), densite: 0.85 },   // carré plein : visuellement plus lourd
  { nom: 'pizolub', fichier: path.join(LOGOS, 'Pizolub.jpg'), fondBlanc: true },
];
// Gab'Oil : logo vectoriel remis par le client le 23/10/2026 (celui du site SNHG était le logo de Gabon Oil Company),
// copié tel quel ; son cadre (viewBox) est serré sur le dessin. Fichier hors du dépôt, modifiable par GABOIL_SVG.
const GABOIL_SVG = process.env.GABOIL_SVG || path.join(require('os').homedir(), 'Downloads', 'GABOIL-logo.svg');

const SURFACE = 8000, H_MAX = 80, L_MAX = 200, MARGE = 0.02;
// Taille optique (px) d'un logo de proportions données : même surface visuelle pour tous, dans le cadre maximal
const tailleOptique = (ratio, densite = 1) => {
  const lw = Math.sqrt(SURFACE * ratio), lh = Math.sqrt(SURFACE / ratio);
  const k = Math.min(1, H_MAX / lh, L_MAX / lw) * densite;
  return [Math.round(lw * k), Math.round(lh * k)];
};

const dimensions = (f) => execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', f])
  .toString().trim().split(',').map(Number);
const decoder = (f) => execFileSync('ffmpeg', ['-v', 'error', '-i', f, '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'], { maxBuffer: 1 << 28 });

function detourerFondBlanc(px, w, h) {
  const clair = (i) => Math.min(px[i], px[i + 1], px[i + 2]) >= 232;
  const vu = new Uint8Array(w * h);
  const pile = [];
  for (let x = 0; x < w; x++) pile.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) pile.push(y * w, y * w + w - 1);
  while (pile.length) {
    const p = pile.pop();
    if (vu[p] || !clair(p * 4)) continue;
    vu[p] = 1; px[p * 4 + 3] = 0;
    const x = p % w, y = (p / w) | 0;
    if (x > 0) pile.push(p - 1); if (x < w - 1) pile.push(p + 1);
    if (y > 0) pile.push(p - w); if (y < h - 1) pile.push(p + w);
  }
  // Bord adouci : pixels clairs voisins du fond retiré, blanc soustrait de la couleur.
  for (let p = 0; p < w * h; p++) {
    if (vu[p]) continue;
    const x = p % w, y = (p / w) | 0;
    const voisin = (x > 0 && vu[p - 1]) || (x < w - 1 && vu[p + 1]) || (y > 0 && vu[p - w]) || (y < h - 1 && vu[p + w]);
    if (!voisin) continue;
    const i = p * 4, m = Math.min(px[i], px[i + 1], px[i + 2]);
    if (m < 180) continue;
    const a = Math.max(0.05, Math.min(1, (255 - m) / 75));
    for (let c = 0; c < 3; c++) px[i + c] = Math.max(0, Math.min(255, Math.round((px[i + c] - 255 * (1 - a)) / a)));
    px[i + 3] = Math.round(255 * a);
  }
}

function rogner(px, w, h) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (px[(y * w + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  const m = Math.round(Math.max(x1 - x0, y1 - y0) * MARGE);
  x0 = Math.max(0, x0 - m); y0 = Math.max(0, y0 - m); x1 = Math.min(w - 1, x1 + m); y1 = Math.min(h - 1, y1 + m);
  const lw = x1 - x0 + 1, lh = y1 - y0 + 1, sortie = Buffer.alloc(lw * lh * 4);
  for (let y = 0; y < lh; y++) px.copy(sortie, y * lw * 4, ((y + y0) * w + x0) * 4, ((y + y0) * w + x1 + 1) * 4);
  return { px: sortie, w: lw, h: lh };
}

fs.mkdirSync(DST, { recursive: true });
const tailles = {};
for (const s of SOURCES) {
  const [w, h] = dimensions(s.fichier);
  const px = decoder(s.fichier);
  if (s.fondBlanc) detourerFondBlanc(px, w, h);
  const r = rogner(px, w, h);
  const [lw, lh] = tailleOptique(r.w / r.h, s.densite);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${r.w}x${r.h}`, '-i', '-',
    '-vf', `scale=${lw * 2}:${lh * 2}:flags=lanczos`, '-pix_fmt', 'rgba', path.join(DST, `${s.nom}.png`)], { input: r.px });
  tailles[s.nom] = { largeur: lw, hauteur: lh };
  console.log(`${s.nom.padEnd(8)} ${String(lw).padStart(3)} × ${lh} px (fichier ${lw * 2} × ${lh * 2})`);
}
const svg = fs.readFileSync(GABOIL_SVG, 'utf8');
fs.writeFileSync(path.join(DST, 'gab-oil.svg'), svg);
const [, , vw, vh] = svg.match(/viewBox="([^"]+)"/)[1].trim().split(/[\s,]+/).map(Number);
const [lw, lh] = tailleOptique(vw / vh);
tailles['gab-oil'] = { largeur: lw, hauteur: lh };
console.log(`${'gab-oil'.padEnd(8)} ${String(lw).padStart(3)} × ${lh} px (SVG)`);
fs.writeFileSync(path.join(DST, 'tailles.json'), JSON.stringify(tailles, null, 2));
