#!/usr/bin/env node
/**
 * Prépare les images d'aperçu des liens partagés (Open Graph : WhatsApp, LinkedIn, Facebook, X) : 1200 × 630 px,
 * recadrées dans la photo d'ouverture de chaque page, au même point focal que sur la page.
 *
 *  Pages     : "partage" de l'en-tête JSON ({ src, position }) s'il existe, sinon la photo préchargée de l'ouverture
 *  Articles  : image à la une (sources/actualites.json) ; ceux illustrés d'une vignette SVG prennent l'image par défaut
 *  Défaut    : partage.IMAGE_DEFAUT, pour toute page sans image propre
 *
 * La règle de choix est celle de scripts/partage.js, que scripts/assembler-pages.js applique pour écrire og:image.
 * Sortie : img/partage/<nom de la photo d'origine>.jpg
 * Usage  : node scripts/preparer-partage.js   (ffmpeg requis), puis node scripts/assembler-pages.js
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const actualites = require('./actualites');
const partage = require('./partage');

const RACINE = path.join(__dirname, '..');
const SOURCES = path.join(RACINE, 'sources');

/* Point focal CSS (« 65% 30% », « center top »…) → fractions x et y */
const MOTS = { left: 0, top: 0, center: 0.5, right: 1, bottom: 1 };
function focal(position) {
  let [x = 'center', y = 'center'] = position.trim().split(/\s+/);
  if (x === 'top' || x === 'bottom') [x, y] = [y, x];
  const valeur = (v) => (v in MOTS ? MOTS[v] : parseFloat(v) / 100);
  return [valeur(x), valeur(y)];
}

// Images à produire, une par fichier de sortie
const images = new Map();
const ajouter = (image) => { if (image) images.set(partage.cible(image.src), image); };
ajouter(partage.IMAGE_DEFAUT);
for (const f of fs.readdirSync(path.join(SOURCES, 'pages'), { recursive: true }).filter((f) => f.endsWith('.html'))) {
  const brut = fs.readFileSync(path.join(SOURCES, 'pages', f), 'utf8');
  const m = brut.match(/^<!--([\s\S]*?)-->\n/);
  ajouter(partage.source(JSON.parse(m[1]), brut.slice(m[0].length)));
}
const libelles = JSON.parse(fs.readFileSync(path.join(SOURCES, 'libelles.json'), 'utf8'));
const actus = actualites.charger(SOURCES, 'fr', libelles.fr);   // images communes aux deux langues
for (const a of actus.articles) {
  const { meta, contenu } = actualites.pageArticle(a, actus);
  ajouter(partage.source(meta, contenu));
}

fs.mkdirSync(path.join(RACINE, partage.DOSSIER), { recursive: true });
const { LARGEUR: L, HAUTEUR: H } = partage;
for (const [cible, { src, position }] of images) {
  const [x, y] = focal(position || '50% 50%');
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', path.join(RACINE, src),
    '-vf', `scale=${L}:${H}:force_original_aspect_ratio=increase,crop=${L}:${H}:(iw-ow)*${x}:(ih-oh)*${y}`,
    '-map_metadata', '-1', '-q:v', '3', path.join(RACINE, cible)]);
  console.log(`${cible}  ←  ${src} (${position || 'centre'})  ${Math.round(fs.statSync(path.join(RACINE, cible)).size / 1024)} Ko`);
}
console.log(`${images.size} image(s) de partage dans ${partage.DOSSIER}/`);
