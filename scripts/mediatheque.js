/**
 * Médiathèque : modèles d'affichage des galeries décrites dans sources/mediatheque.json.
 * Chaque galerie préfigure un bloc Galerie de WordPress (un album par site) :
 *
 *  sommaire()   pastilles de navigation vers chaque galerie (ancres), avec le nombre de photos
 *  galerie()    une section par site : type de site, titre, présentation, mosaïque de 3 à 7 photos
 *               dont la première est mise en avant ; chaque photo ouvre la visionneuse (app.js)
 *
 * Langues : le fichier français décrit tout (photos, ordre) ; sources/<langue>/mediatheque.json ne donne que ce qui se
 * traduit (type de site, titre, présentation, texte alternatif de chaque photo, dans l'ordre). Une traduction manquante
 * arrête la génération.
 *
 * Utilisé par scripts/assembler-pages.js : repères <!-- mediatheque:sommaire -->, <!-- mediatheque:galeries -->,
 * {{mediatheque:photos}} et {{mediatheque:galeries}} dans la source de la page.
 * Les photos sont produites par scripts/preparer-mediatheque.js dans img/mediatheque/<galerie>/.
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

/* Traduction des galeries : textes de sources/<langue>/mediatheque.json sur les données françaises */
function traduire(d, sources, langue) {
  const trad = JSON.parse(fs.readFileSync(path.join(sources, langue, 'mediatheque.json'), 'utf8'));
  const manque = (quoi) => { throw new Error(`${langue}/mediatheque.json : pas de traduction pour ${quoi}`); };
  for (const g of d.galeries) {
    const t = trad.galeries[g.slug] || manque(`la galerie « ${g.slug} »`);
    for (const champ of ['type', 'titre', 'description']) g[champ] = t[champ] || manque(`« ${g.slug} ».${champ}`);
    if ((t.photos || []).length !== g.photos.length) manque(`les ${g.photos.length} photos de « ${g.slug} »`);
    g.photos.forEach((p, i) => { p.alt = t.photos[i]; });
  }
}

function charger(sources, langue, t) {
  const d = JSON.parse(fs.readFileSync(path.join(sources, 'mediatheque.json'), 'utf8'));
  if (langue !== 'fr') traduire(d, sources, langue);
  d.t = t;
  const img = path.join(sources, '..', 'img', 'mediatheque');
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

const nombrePhotos = (n, t) => `${n} ${n > 1 ? t.photos : t.photo}`;

const sommaire = (d) => `        <ul>
${d.galeries.map((g) => `          <li><a href="#${g.slug}">${g.titre} <span class="filtre-nombre">${g.photos.length}<span class="visuellement-masque"> ${d.t.photos}</span></span></a></li>`).join('\n')}
        </ul>`;

/* Photo de la mosaïque : lien vers la grande image (ouverte telle quelle sans JavaScript, dans la visionneuse sinon) */
function photo(g, p, i) {
  const tailles = i === 0 ? '(max-width: 767px) 100vw, 60vw' : '(max-width: 767px) 50vw, 30vw';
  return `          <li><a class="galerie-photo" href="${p.grande}" data-visionneuse="${g.slug}" data-largeur="${p.tailleGrande.largeur}" data-hauteur="${p.tailleGrande.hauteur}">`
    + `<img src="${p.petite}" srcset="${p.petite} 800w, ${p.grande} ${p.tailleGrande.largeur}w" sizes="${tailles}" alt="${p.alt}" width="${p.taillePetite.largeur}" height="${p.taillePetite.hauteur}" loading="lazy"></a></li>`;
}

const galerie = (g, rang, t) => `
  <!-- Galerie : ${g.titre} -->
  <section class="section galerie${rang % 2 ? '' : ' fond-surface'}" id="${g.slug}" aria-labelledby="galerie-${g.slug}">
    <div class="conteneur">
      <div class="galerie-tete" data-apparition>
        <div>
          <p class="sur-titre">${g.type}</p>
          <h2 class="titre-section" id="galerie-${g.slug}">${g.titre}</h2>
        </div>
        <p class="galerie-texte">${g.description} <span class="galerie-nombre">${nombrePhotos(g.photos.length, t)}</span></p>
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
    .replace(/^[ \t]*<!-- mediatheque:galeries -->/m, () => d.galeries.map((g, rang) => galerie(g, rang, d.t)).join('\n'))
    .replace(/\{\{mediatheque:photos\}\}/g, () => String(photos))
    .replace(/\{\{mediatheque:galeries\}\}/g, () => String(d.galeries.length));
}

module.exports = { charger, remplir };
