/**
 * Médiathèque : modèles d'affichage des galeries décrites dans sources/mediatheque.json.
 * Chaque galerie préfigure un bloc Galerie de WordPress (un album par site) :
 *
 *  sommaire()   pastilles de navigation vers chaque galerie (ancres), avec le nombre de photos
 *  galerie()    une section par site : type de site, titre, présentation, mosaïque de 5 à 7 photos
 *               dont la première est mise en avant ; chaque photo ouvre la visionneuse (app.js)
 *
 * Utilisé par scripts/assembler-pages.js : repères <!-- mediatheque:sommaire -->, <!-- mediatheque:galeries -->,
 * {{mediatheque:photos}} et {{mediatheque:galeries}} dans la source de la page.
 * Les photos sont produites par scripts/preparer-mediatheque.js dans maquette/img/mediatheque/<galerie>/.
 */
const fs = require('fs');
const path = require('path');

// Dimensions réelles d'un JPEG (marqueur SOF), pour les attributs width et height
function dimensions(fichier) {
  if (!fs.existsSync(fichier)) throw new Error(`photo manquante : ${fichier} (lancer node scripts/preparer-mediatheque.js)`);
  const b = fs.readFileSync(fichier);
  for (let i = 2; i < b.length;) {
    const m = b[i + 1];
    if (m >= 0xC0 && m <= 0xC3) return { largeur: b.readUInt16BE(i + 7), hauteur: b.readUInt16BE(i + 5) };
    i += 2 + b.readUInt16BE(i + 2);
  }
  throw new Error(`dimensions illisibles : ${fichier}`);
}

function charger(sources) {
  const d = JSON.parse(fs.readFileSync(path.join(sources, 'mediatheque.json'), 'utf8'));
  const img = path.join(sources, '..', 'maquette', 'img', 'mediatheque');
  for (const g of d.galeries) {
    g.photos.forEach((p, i) => {
      const n = String(i + 1).padStart(2, '0');
      p.petite = `img/mediatheque/${g.slug}/${n}-800.jpg`;
      p.grande = `img/mediatheque/${g.slug}/${n}-1600.jpg`;
      p.taillePetite = dimensions(path.join(img, g.slug, `${n}-800.jpg`));
      p.tailleGrande = dimensions(path.join(img, g.slug, `${n}-1600.jpg`));
    });
  }
  return d;
}

const pluriel = (n, mot) => `${n} ${mot}${n > 1 ? 's' : ''}`;

const sommaire = (d) => `        <ul>
${d.galeries.map((g) => `          <li><a href="#${g.slug}">${g.titre} <span class="filtre-nombre">${g.photos.length}<span class="visuellement-masque"> photos</span></span></a></li>`).join('\n')}
        </ul>`;

/* Photo de la mosaïque : lien vers la grande image (ouverte telle quelle sans JavaScript, dans la visionneuse sinon) */
function photo(g, p, i) {
  const tailles = i === 0 ? '(max-width: 767px) 100vw, 60vw' : '(max-width: 767px) 50vw, 30vw';
  return `          <li><a class="galerie-photo" href="${p.grande}" data-visionneuse="${g.slug}" data-largeur="${p.tailleGrande.largeur}" data-hauteur="${p.tailleGrande.hauteur}">`
    + `<img src="${p.petite}" srcset="${p.petite} 800w, ${p.grande} 1600w" sizes="${tailles}" alt="${p.alt}" width="${p.taillePetite.largeur}" height="${p.taillePetite.hauteur}" loading="lazy"></a></li>`;
}

const galerie = (g, rang) => `
  <!-- Galerie : ${g.titre} -->
  <section class="section galerie${rang % 2 ? '' : ' fond-surface'}" id="${g.slug}" aria-labelledby="galerie-${g.slug}">
    <div class="conteneur">
      <div class="galerie-tete" data-apparition>
        <div>
          <p class="sur-titre">${g.type}</p>
          <h2 class="titre-section" id="galerie-${g.slug}">${g.titre}</h2>
        </div>
        <p class="galerie-texte">${g.description} <span class="galerie-nombre">${pluriel(g.photos.length, 'photo')}</span></p>
      </div>
      <ul class="galerie-grille" data-nombre="${g.photos.length}" data-cascade>
${g.photos.map((p, i) => photo(g, p, i)).join('\n')}
      </ul>
    </div>
  </section>`;

function remplir(contenu, d) {
  const photos = d.galeries.reduce((t, g) => t + g.photos.length, 0);
  return contenu
    .replace(/^[ \t]*<!-- mediatheque:sommaire -->/m, () => sommaire(d))
    .replace(/^[ \t]*<!-- mediatheque:galeries -->/m, () => d.galeries.map(galerie).join('\n'))
    .replace(/\{\{mediatheque:photos\}\}/g, () => String(photos))
    .replace(/\{\{mediatheque:galeries\}\}/g, () => String(d.galeries.length));
}

module.exports = { charger, remplir };
