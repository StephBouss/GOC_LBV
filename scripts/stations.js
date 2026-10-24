/**
 * Réseau de stations-service Gab'Oil : carte du Gabon et liste des stations décrites dans sources/stations.json.
 * Chaque station préfigure un contenu WordPress « Station » (nom, ville, province, état, latitude, longitude) :
 *
 *  carte()     fond de carte (sources/carte-gabon.json : provinces, pays voisins, encart du Grand Libreville) et un point
 *              par station placée, coloré selon son état ; les stations de la zone agrandie sont dessinées dans l'encart.
 *              La bulle du point actif montre la photo de la station (« photo », facultative), sinon le logo Gab'Oil
 *  filtres()   pastilles par état (toutes, en service, en construction, études), avec le nombre de stations
 *  liste()     stations groupées par état ; survoler ou choisir une station fait briller son point (app.js)
 *
 * Position d'un point : x = (longitude − 7,2) × 100, y = (2,55 − latitude) × 100, en unités de la carte (même formule dans
 * le thème WordPress). Une station sans coordonnées figure dans la liste, sans point sur la carte.
 *
 * Langues : le fichier français décrit tout ; sources/<langue>/stations.json traduit les états, les noms de la carte et,
 * au besoin, le nom d'une station. Utilisé par scripts/assembler-pages.js : repères <!-- stations:carte -->,
 * <!-- stations:filtres -->, <!-- stations:liste --> et {{stations:total}}, {{stations:service}}, {{stations:construction}},
 * {{stations:etudes}} dans la source de la page.
 */
const fs = require('fs');
const path = require('path');

const ETATS = ['service', 'construction', 'etudes'];
const echapper = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const arrondi = (v) => Math.round(v * 10) / 10;

function charger(sources, langue) {
  const lire = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
  const d = lire(path.join(sources, 'stations.json'));
  const fond = lire(path.join(sources, 'carte-gabon.json'));
  if (langue !== 'fr') {
    const trad = lire(path.join(sources, langue, 'stations.json'));
    for (const cle of ['etats', 'carte', 'textes']) {
      for (const k of Object.keys(d[cle])) {
        if (!trad[cle] || !trad[cle][k]) throw new Error(`${langue}/stations.json : pas de traduction pour ${cle}.${k}`);
        d[cle][k] = trad[cle][k];
      }
    }
    for (const s of d.stations) Object.assign(s, (trad.stations || {})[s.id]);
  }
  const { projection: p, encart: e } = fond;
  const [zx, zy, zl, zh] = e.zone;
  for (const s of d.stations) {
    if (!ETATS.includes(s.etat)) throw new Error(`stations.json : état inconnu « ${s.etat} » (${s.id})`);
    if (typeof s.lat !== 'number' || typeof s.lon !== 'number') continue;
    const x = (s.lon - p.lonMin) * p.echelle, y = (p.latMax - s.lat) * p.echelle;
    s.encart = x >= zx && x <= zx + zl && y >= zy && y <= zy + zh;
    s.x = arrondi(s.encart ? e.cadre[0] + (x - zx) * e.echelle : x);
    s.y = arrondi(s.encart ? e.cadre[1] + (y - zy) * e.echelle : y);
  }
  d.fond = fond;
  return d;
}

const nombre = (d, etat) => d.stations.filter((s) => !etat || s.etat === etat).length;
const lieu = (s) => [s.ville !== s.nom ? s.ville : '', s.province || ''].filter(Boolean).join(' · ');

function carte(d) {
  const f = d.fond;
  const [zx, zy, zl, zh] = f.encart.zone, [cx, cy, cl, ch] = f.encart.cadre;
  const points = d.stations.filter((s) => s.x !== undefined).map((s) => `          <g class="point" data-station="${s.id}" data-etat="${s.etat}"${s.encart ? ' data-encart' : ''} transform="translate(${s.x} ${s.y})"><g class="point-forme"><circle class="point-halo" r="7"/><circle class="point-coeur" r="5.5"/></g></g>`);
  return `<figure class="stations-carte" data-apparition>
        <div class="carte-cadre">
          <svg class="carte-gabon" viewBox="0 0 ${f.largeur} ${f.hauteur}" role="img" aria-labelledby="carte-titre">
          <title id="carte-titre">${echapper(d.carte.titre)}</title>
          <defs>
            <g id="carte-provinces">${f.provinces.map((p) => `<path d="${p.d}"/>`).join('')}</g>
            <clipPath id="carte-encart-decoupe"><rect x="${cx}" y="${cy}" width="${cl}" height="${ch}" rx="6"/></clipPath>
          </defs>
          <rect class="carte-ocean" width="${f.largeur}" height="${f.hauteur}"/>
          <g class="carte-voisins">${f.voisins.map((v) => `<path d="${v.d}"/>`).join('')}</g>
          <use class="carte-frontiere" href="#carte-provinces"/>
          <use class="carte-provinces" href="#carte-provinces"/>
          <g class="carte-noms" aria-hidden="true">
            ${f.provinces.map((p) => `<text class="carte-province-nom" x="${p.nom_x}" y="${p.nom_y}">${echapper(p.nom)}</text>`).join('')}
            ${f.voisins.map((v) => `<text class="carte-voisin-nom" x="${v.nom_x}" y="${v.nom_y}">${echapper(d.carte[v.id])}</text>`).join('')}
            <text class="carte-ocean-nom" x="${f.ocean[0]}" y="${f.ocean[1]}">${echapper(d.carte.ocean)}</text>
          </g>
          <g class="carte-encart" aria-hidden="true">
            <path class="carte-renvoi" d="M${zx} ${zy + zh}L${cx} ${cy + ch}M${zx + zl} ${zy}L${cx + cl} ${cy}"/>
            <rect class="carte-zone" x="${zx}" y="${zy}" width="${zl}" height="${zh}"/>
            <rect class="carte-encart-fond" x="${cx}" y="${cy}" width="${cl}" height="${ch}" rx="6"/>
            <path class="carte-encart-terre" clip-path="url(#carte-encart-decoupe)" d="${f.encart.terre}"/>
            <rect class="carte-encart-cadre" x="${cx}" y="${cy}" width="${cl}" height="${ch}" rx="6"/>
            <text class="carte-encart-nom" x="${cx + 10}" y="${cy + ch - 10}">${echapper(d.carte.encart)}</text>
          </g>
          <g class="carte-points" aria-hidden="true">
${points.join('\n')}
          </g>
          </svg>
          <div class="carte-bulle" aria-hidden="true" hidden>
            <span class="carte-bulle-photo">
${d.stations.filter((s) => s.photo && s.x !== undefined).map((s) => `              <img src="${s.photo}" alt="" data-station="${s.id}" width="768" height="512" loading="lazy" hidden>`).join('\n')}
              <img class="carte-bulle-logo" src="img/filiales/gab-oil.svg" alt="" data-station="" loading="lazy" hidden>
            </span>
            <span class="carte-bulle-texte"></span>
          </div>
        </div>
        <figcaption class="carte-legende">
          <ul>
${ETATS.map((e) => `            <li><span class="pastille-etat" data-etat="${e}" aria-hidden="true"></span>${echapper(d.etats[e])}</li>`).join('\n')}
          </ul>
        </figcaption>
      </figure>`;
}

const filtres = (d) => `<div class="filtres stations-filtres" role="group" aria-label="${echapper(d.textes.filtrer)}">
          <ul>
            <li><button type="button" data-filtre="" aria-pressed="true">${echapper(d.textes.toutes)} <span class="filtre-nombre">${nombre(d)}</span></button></li>
${ETATS.map((e) => `            <li><button type="button" data-filtre="${e}" aria-pressed="false">${echapper(d.etats[e])} <span class="filtre-nombre">${nombre(d, e)}</span></button></li>`).join('\n')}
          </ul>
        </div>`;

function station(s) {
  const texte = `<span class="pastille-etat" data-etat="${s.etat}" aria-hidden="true"></span><span class="station-texte"><span class="station-nom">${echapper(s.nom)}</span>${lieu(s) ? `<span class="station-lieu">${echapper(lieu(s))}</span>` : ''}</span>`;
  // Sans coordonnées, rien à montrer sur la carte : simple ligne de liste
  if (s.x === undefined) return `<li><span class="station sans-point" data-station="${s.id}">${texte}</span></li>`;
  return `<li><button class="station" type="button" data-station="${s.id}" aria-pressed="false">${texte}<svg class="icone station-repere" aria-hidden="true"><use href="#i-repere"/></svg></button></li>`;
}

const liste = (d) => ETATS.map((e) => `<section class="stations-groupe" data-etat="${e}" data-libelle="${echapper(d.etats[e])}" aria-labelledby="etat-${e}">
          <h3 class="stations-etat" id="etat-${e}"><span class="pastille-etat" data-etat="${e}" aria-hidden="true"></span>${echapper(d.etats[e])} <span class="stations-nombre">${nombre(d, e)}</span></h3>
          <ul>
${d.stations.filter((s) => s.etat === e).map((s) => `            ${station(s)}`).join('\n')}
          </ul>
        </section>`).join('\n        ');

function remplir(contenu, d) {
  if (!contenu.includes('stations:')) return contenu;
  return contenu
    .replace(/^[ \t]*<!-- stations:carte -->/m, (m) => m.replace('<!-- stations:carte -->', carte(d)))
    .replace(/^[ \t]*<!-- stations:filtres -->/m, (m) => m.replace('<!-- stations:filtres -->', filtres(d)))
    .replace(/^[ \t]*<!-- stations:liste -->/m, (m) => m.replace('<!-- stations:liste -->', liste(d)))
    .replace(/\{\{stations:(total|service|construction|etudes)\}\}/g, (_, e) => String(nombre(d, e === 'total' ? '' : e)));
}

module.exports = { charger, remplir };
