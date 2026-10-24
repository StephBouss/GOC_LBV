#!/usr/bin/env node
/**
 * Prépare les photos de la médiathèque décrites dans sources/mediatheque.json, depuis le reportage
 * « Opérations GOC » fourni par le client (photos de 4 600 à 7 000 px, hors du dépôt).
 *
 *  img/mediatheque/<galerie>/<nn>-800.jpg    vignette de la grille
 *  img/mediatheque/<galerie>/<nn>-1600.jpg   grande image (visionneuse, cases mises en avant)
 *  img/mediatheque/ouverture(-768).jpg       photo d'ouverture de la page, au format 3:2
 *
 * Les photos sont rangées dans un sous-dossier : scripts/preparer-images.sh vide img/*.jpg.
 * Usage : node scripts/preparer-mediatheque.js   (dossier source modifiable par MEDIATHEQUE_SOURCE ; ffmpeg requis)
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RACINE = path.join(__dirname, '..');
const SOURCE = process.env.MEDIATHEQUE_SOURCE
  || path.join(RACINE, '..', 'Img', 'Inspiration images', 'Site web GOC', 'Photo Autre', 'Opérations GOC');
const DST = path.join(RACINE, 'img', 'mediatheque');
const donnees = JSON.parse(fs.readFileSync(path.join(RACINE, 'sources', 'mediatheque.json'), 'utf8'));

// Les accents des noms de dossiers peuvent être enregistrés décomposés (copie depuis un Mac) :
// chaque élément du chemin est retrouvé en comparant les noms normalisés.
function retrouver(relatif) {
  let courant = path.dirname(SOURCE);
  for (const nom of [path.basename(SOURCE), ...relatif.split('/')]) {
    const trouve = fs.readdirSync(courant).find((n) => n.normalize('NFC') === nom.normalize('NFC'));
    if (!trouve) throw new Error(`introuvable : ${nom} dans ${courant}`);
    courant = path.join(courant, trouve);
  }
  return courant;
}

const ffmpeg = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args]);

fs.mkdirSync(DST, { recursive: true });
let nombre = 0;
for (const g of donnees.galeries) {
  const dossier = path.join(DST, g.slug);
  fs.rmSync(dossier, { recursive: true, force: true });   // une photo retirée du fichier de données disparaît du site
  fs.mkdirSync(dossier);
  g.photos.forEach((p, i) => {
    const n = String(i + 1).padStart(2, '0');
    // une photo plus petite que 1600 px (Akondo : 960 px) garde sa taille : jamais d'agrandissement
    ffmpeg(['-i', retrouver(p.source), '-filter_complex', "[0]split=2[a][b];[a]scale='min(1600,iw)':-2:flags=lanczos[g];[b]scale=800:-2:flags=lanczos[v]",
      '-map', '[g]', '-q:v', '5', '-map_metadata', '-1', path.join(dossier, `${n}-1600.jpg`),
      '-map', '[v]', '-q:v', '4', '-map_metadata', '-1', path.join(dossier, `${n}-800.jpg`)]);
    nombre++;
  });
  console.log(`${g.slug.padEnd(12)} ${g.photos.length} photos`);
}

// Ouverture : recadrage au format 3:2 des autres pages (centré), en 1536 et 768 px
const o = retrouver(donnees.ouverture.source);
ffmpeg(['-i', o, '-filter_complex', "[0]crop=iw:iw*2/3,split=2[a][b];[a]scale=1536:1024:flags=lanczos[g];[b]scale=768:512:flags=lanczos[v]",
  '-map', '[g]', '-q:v', '4', '-map_metadata', '-1', path.join(DST, 'ouverture.jpg'),
  '-map', '[v]', '-q:v', '4', '-map_metadata', '-1', path.join(DST, 'ouverture-768.jpg')]);
console.log(`${nombre} photos préparées, ouverture comprise dans img/mediatheque/`);
