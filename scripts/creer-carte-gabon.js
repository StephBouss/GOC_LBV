#!/usr/bin/env node
/**
 * Fond de carte du Gabon de la page des stations Gab'Oil : les 9 provinces, les pays voisins et l'océan, projetés pour un SVG.
 * Source : Natural Earth, « Admin 1 – States, Provinces » au 1:10 000 000 (domaine public, sans mention obligatoire).
 *
 * Projection équirectangulaire à 100 unités par degré : x = (longitude − 7,2) × 100, y = (2,55 − latitude) × 100.
 * À l'équateur, l'écart avec une projection conforme est négligeable ; la même formule place les stations
 * (scripts/stations.js, puis le thème WordPress à partir des champs latitude et longitude).
 * L'encart du Grand Libreville agrandit la zone où les stations sont trop proches pour être distinguées sur la carte entière.
 *
 * Sortie : sources/carte-gabon.json (tracés en unités de la carte, position des noms, cadre de l'encart)
 * Usage  : node scripts/creer-carte-gabon.js [ne_10m_admin_1_states_provinces.geojson]
 *          (sans fichier : téléchargement depuis le dépôt GitHub de Natural Earth, 40 Mo)
 */
const fs = require('fs');
const path = require('path');

const SORTIE = path.join(__dirname, '..', 'sources', 'carte-gabon.json');
const URL_NE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson';

const PROJECTION = { lonMin: 7.2, latMax: 2.55, echelle: 100 };
const LARGEUR = 745, HAUTEUR = 670;                                    // de 7,2° à 14,65° E, de 2,55° N à 4,15° S
const TOLERANCE = 0.4;                                                 // simplification des tracés, en unités de la carte
// Encart : zone agrandie (longitudes et latitudes) et cadre où elle s'affiche, dans l'océan au nord-ouest de Libreville
const ENCART = { zone: [9.36, 0.26, 9.66, 0.545], cadre: [12, 12, 196, 186] };
// Noms des provinces : au centre de leur plus grand polygone, sauf quand un décalage les lit mieux (unités de la carte)
const NOMS = {
  'Wouleu-Ntem': 'Woleu-Ntem',                                         // orthographe officielle
};
const DECALAGES = { estuaire: [18, -8], 'ogooue-maritime': [30, 36], 'moyen-ogooue': [0, 6], 'ogooue-ivindo': [0, 30], 'haut-ogooue': [0, 52], 'woleu-ntem': [36, 16] };
const VOISINS = { CMR: 'cameroun', GNQ: 'guinee-equatoriale', COG: 'congo' };
const NOMS_VOISINS = { cameroun: [560, 14], 'guinee-equatoriale': [300, 88], congo: [640, 600] };
const OCEAN = [92, 420];

const projeter = ([lon, lat]) => [(lon - PROJECTION.lonMin) * PROJECTION.echelle, (PROJECTION.latMax - lat) * PROJECTION.echelle];
const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Douglas-Peucker sur un anneau fermé
function simplifier(points, tol) {
  if (points.length < 5) return points;
  const garder = new Uint8Array(points.length);
  garder[0] = garder[points.length - 1] = 1;
  const pile = [[0, points.length - 1]];
  while (pile.length) {
    const [a, b] = pile.pop();
    const [ax, ay] = points[a], [bx, by] = points[b];
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
    let max = 0, indice = -1;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = points[i];
      const d = l2 ? Math.abs(dy * px - dx * py + bx * ay - by * ax) / Math.sqrt(l2) : Math.hypot(px - ax, py - ay);
      if (d > max) { max = d; indice = i; }
    }
    if (max > tol) { garder[indice] = 1; pile.push([a, indice], [indice, b]); }
  }
  return points.filter((_, i) => garder[i]);
}

// Découpe d'un anneau par le cadre de la carte (Sutherland-Hodgman), pour ne garder des voisins que la partie visible
function decouper(points, [x0, y0, x1, y1]) {
  const bords = [
    (p) => p[0] >= x0, (p) => p[0] <= x1, (p) => p[1] >= y0, (p) => p[1] <= y1,
  ];
  const croiser = (p, q, k) => {
    const [px, py] = p, [qx, qy] = q;
    const v = [x0, x1, y0, y1][k];
    if (k < 2) { const t = (v - px) / (qx - px); return [v, py + t * (qy - py)]; }
    const t = (v - py) / (qy - py); return [px + t * (qx - px), v];
  };
  let sortie = points;
  bords.forEach((dedans, k) => {
    const entree = sortie;
    sortie = [];
    entree.forEach((p, i) => {
      const q = entree[(i + 1) % entree.length];
      if (dedans(p)) { sortie.push(p); if (!dedans(q)) sortie.push(croiser(p, q, k)); } else if (dedans(q)) sortie.push(croiser(p, q, k));
    });
  });
  return sortie;
}

// Tracé SVG compact : premier point absolu, puis déplacements relatifs entre points arrondis au dixième
const nombre = (v) => String(Math.round(v * 10) / 10).replace(/^(-?)0\./, '$1.');
function trace(anneaux) {
  return anneaux.map((anneau) => {
    const pts = anneau.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10])
      .filter((p, i, t) => i === 0 || p[0] !== t[i - 1][0] || p[1] !== t[i - 1][1]);
    let d = `M${nombre(pts[0][0])} ${nombre(pts[0][1])}l`;
    for (let i = 1; i < pts.length; i++) {
      const dx = nombre(pts[i][0] - pts[i - 1][0]), dy = nombre(pts[i][1] - pts[i - 1][1]);
      d += `${i > 1 && !dx.startsWith('-') ? ' ' : ''}${dx}${dy.startsWith('-') ? '' : ' '}${dy}`;
    }
    return `${d}z`;
  }).join('');
}

// Centre d'un polygone (centre de gravité de sa surface)
function centre(anneau) {
  let a = 0, cx = 0, cy = 0;
  anneau.forEach(([x1, y1], i) => {
    const [x2, y2] = anneau[(i + 1) % anneau.length];
    const f = x1 * y2 - x2 * y1;
    a += f; cx += (x1 + x2) * f; cy += (y1 + y2) * f;
  });
  return [cx / (3 * a), cy / (3 * a)];
}
const surface = (anneau) => Math.abs(anneau.reduce((s, [x1, y1], i) => { const [x2, y2] = anneau[(i + 1) % anneau.length]; return s + x1 * y2 - x2 * y1; }, 0) / 2);
const polygones = (g) => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates);

(async () => {
  const fichier = process.argv[2];
  const brut = fichier ? fs.readFileSync(fichier, 'utf8') : await (await fetch(URL_NE)).text();
  const entites = JSON.parse(brut).features;
  const cadre = [-5, -5, LARGEUR + 5, HAUTEUR + 5];

  const provinces = entites.filter((f) => f.properties.adm0_a3 === 'GAB').map((f) => {
    const nom = NOMS[f.properties.name] || f.properties.name;
    const id = slug(nom);
    const anneaux = polygones(f.geometry).map((p) => simplifier(p[0].map(projeter), TOLERANCE)).filter((a) => a.length > 3);
    const [cx, cy] = centre(anneaux.reduce((m, a) => (surface(a) > surface(m) ? a : m)));
    const [dx, dy] = DECALAGES[id] || [0, 0];
    return { id, nom, d: trace(anneaux), nom_x: Math.round(cx + dx), nom_y: Math.round(cy + dy) };
  }).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  if (provinces.length !== 9) throw new Error(`${provinces.length} provinces trouvées au lieu de 9`);

  const voisins = Object.entries(VOISINS).map(([code, id]) => {
    const anneaux = entites.filter((f) => f.properties.adm0_a3 === code)
      .flatMap((f) => polygones(f.geometry).map((p) => decouper(p[0].map(projeter), cadre)))
      .filter((a) => a.length > 3).map((a) => simplifier(a, TOLERANCE)).filter((a) => a.length > 3);
    return { id, d: trace(anneaux), nom_x: NOMS_VOISINS[id][0], nom_y: NOMS_VOISINS[id][1] };
  });

  // Encart : la terre de la zone agrandie, tracée à part avec tout le détail de la source (sans simplification préalable)
  const [lon0, lat0, lon1, lat1] = ENCART.zone;
  const [x0, y0] = projeter([lon0, lat1]), [x1, y1] = projeter([lon1, lat0]);
  const [cx, cy, cl] = ENCART.cadre;
  const k = cl / (x1 - x0);
  const versEncart = ([x, y]) => [cx + (x - x0) * k, cy + (y - y0) * k];
  const terre = entites.filter((f) => f.properties.adm0_a3 === 'GAB')
    .flatMap((f) => polygones(f.geometry).map((p) => decouper(p[0].map(projeter), [x0 - 1, y0 - 1, x1 + 1, y1 + 1])))
    .filter((a) => a.length > 3).map((a) => simplifier(a.map(versEncart), TOLERANCE)).filter((a) => a.length > 3);
  const donnees = {
    _lisezmoi: [
      'Fond de carte du Gabon, produit par node scripts/creer-carte-gabon.js à partir de Natural Earth (domaine public). Ne pas modifier à la main.',
      'Unités de la carte : x = (longitude − 7,2) × 100, y = (2,55 − latitude) × 100 ; « encart.zone » (x, y, largeur, hauteur) est la partie de la carte agrandie « encart.echelle » fois dans « encart.cadre », où « encart.terre » la dessine.',
    ],
    projection: PROJECTION,
    largeur: LARGEUR,
    hauteur: HAUTEUR,
    encart: { zone: [x0, y0, x1 - x0, y1 - y0].map((v) => Math.round(v * 10) / 10), cadre: ENCART.cadre, echelle: Math.round(k * 1000) / 1000, terre: trace(terre) },
    ocean: OCEAN,
    provinces,
    voisins,
  };
  fs.writeFileSync(SORTIE, `${JSON.stringify(donnees, null, 2)}\n`);
  const taille = provinces.reduce((s, p) => s + p.d.length, 0) + voisins.reduce((s, v) => s + v.d.length, 0);
  console.log(`${provinces.length} provinces, ${voisins.length} pays voisins, ${Math.round(taille / 1024)} Ko de tracés → ${path.relative(process.cwd(), SORTIE)}`);
})().catch((e) => { console.error(e.message); process.exit(1); });
