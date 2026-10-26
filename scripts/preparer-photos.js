#!/usr/bin/env node
/**
 * Prépare les photos réelles des pages, qui remplacent les visuels générés par IA de la maquette Banani.
 * Elles viennent des reportages fournis par le client (hors du dépôt) : « Photo Autre/Opérations GOC »,
 * « GOC-SNHG - Contenus/Images GOC - SNHG », « Station », « SMP », « GOTALK » (portraits des talents, copiés sous un nom simple)
 * et « Bannières » (visuels composés pour une ouverture de page).
 *
 *  img/photos/<nom>.jpg       1536 × 1024 (paysage), 1024 × 1536 (portrait), 960 × 1200 (talent, GO’TALK) ou 2400 × 1030 (bandeau)
 *  img/photos/<nom>-768.jpg   768 px de large, pour les attributs srcset
 *
 * « zone » (facultative) : partie de la photo d'origine à garder, en fractions [x, y, largeur, hauteur].
 * La photo est ensuite recadrée au centre au format voulu. Le cadrage fin des ouvertures (bandeaux très larges)
 * se règle dans la page, par un point focal : style="object-position: …" sur l'image.
 * Usage : node scripts/preparer-photos.js   (dossier source modifiable par PHOTOS_SOURCE ; ffmpeg requis)
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RACINE = path.join(__dirname, '..');
const SOURCE = process.env.PHOTOS_SOURCE || path.join(RACINE, '..', 'Img', 'Inspiration images', 'Site web GOC');
const DST = path.join(RACINE, 'img', 'photos');

const OPERATIONS = 'Photo Autre/Opérations GOC';
const BUREAUX = 'GOC-SNHG - Contenus/Images GOC - SNHG/Bureaux et staffs bureau_site & NATURE';

const PHOTOS = [
  // Accueil
  { nom: 'accueil-expertise', source: `${OPERATIONS}/Obangué/Obangué - Portrait opérateur mixte dans les installations/DSC01951.jpg` },   // diapositive 2 « 15 ans d'expertise »
  { nom: 'accueil-qui-sommes-nous', source: `${BUREAUX}/3J3A6082.jpg`, format: 'portrait', zone: [0.06, 0.04, 0.88, 0.88] },
  { nom: 'accueil-exploration', source: `${OPERATIONS}/Sardine/Sardine - Installations détails/DSC03132.jpg` },                         // tour de forage
  { nom: 'accueil-production', source: `${BUREAUX}/3J3A6056.jpg` },                                                                      // opérateur à la vanne
  { nom: 'accueil-projets', source: `${OPERATIONS}/Mandji/Mandji - Vues aériennes/DJI_0399.jpg` },                                       // nouvelle installation
  { nom: 'accueil-engagements', source: `${OPERATIONS}/Mboumba/Mboumba - Réunion HSSE/DSC09303.jpg` },
  { nom: 'accueil-cap-2030', source: `${OPERATIONS}/Tsiengui/Tsiengui - Vues aériennes/DJI_0296.jpg` },
  // Pages intérieures
  { nom: 'presentation-hero', source: `${OPERATIONS}/Mboumba/Mboumba - Portrait opérateurs dans les installations/DSC09826.jpg` },
  { nom: 'presentation-adg', source: 'CA/01.10.26AL(headshots)-0014.jpg', format: 'portrait' },                                      // portrait de l'ADG (Mot de l'ADG)
  { nom: 'historique-hero', source: `${OPERATIONS}/Mboumba/Mboumba - Portrait opérateur & drapeau/DSC09258.jpg` },
  { nom: 'filiales-hero', source: 'Station/Inauguration de la station GabOil 1.png' },
  { nom: 'activites-hero', source: `${OPERATIONS}/Tsiengui/Tsiengui - Opérateurs dans les installations/Tsiengui - Opérateur et tanks/DSC01337.jpg` },
  { nom: 'exploration-hero', source: `${OPERATIONS}/Sardine/Sardine - Opérateur manipulant les têtes de puits/DSC03702.jpg` },
  { nom: 'exploration-salle-controle', source: `${OPERATIONS}/Tsiengui/Tsiengui - Salle de controle/DSC01588.jpg` },
  { nom: 'contact-hero', source: `${OPERATIONS}/Port-Gentil/POG - Travail d_équipe/DSC04107.jpg` },
  { nom: 'mentions-legales-hero', source: `${OPERATIONS}/Port-Gentil/POG - Portraits dans les bureaux/DSC04531.jpg` },
  { nom: 'confidentialite-hero', source: `${OPERATIONS}/Port-Gentil/POG - Portraits dans les bureaux/DSC04330.jpg` },
  { nom: 'cookies-hero', source: `${OPERATIONS}/Libreville/Libreville - Portrait hommes bureaux/DSC04958.jpg` },                        // poste informatique
  { nom: 'presentation-vision', source: `${OPERATIONS}/Obangué/Obangué - Portrait opérateur mixte dans les installations/DSC01896.jpg` }, // regard tourné vers l'horizon
  { nom: 'actualites-hero', source: 'Bannières/actualites-perroquet-gris.png', format: 'bandeau' },                                    // perroquet gris en vol (visuel fourni le 26/10/2026)
  { nom: 'rse-hero', source: `${OPERATIONS}/Mandji/Mandji - Vues aériennes/DJI_0353.jpg` },                                             // communautés riveraines
  { nom: 'rse-approche', source: `${OPERATIONS}/Mandji/Mandji - Equipe & nature/DSC02843.jpg` },
  { nom: 'hsei-hero', source: `${OPERATIONS}/Tsiengui/Tsiengui - Prélèvement/DSC01488.jpg` },                                             // opérateur sous masque respiratoire
  { nom: 'projets-hero', source: `${OPERATIONS}/Tsiengui/Tsiengui - Vues aériennes/DJI_0301.jpg` },                                     // champ et réservoirs en forêt
  { nom: 'projets-equipe', source: `${OPERATIONS}/Sardine/Sardine - Opérateurs en discussion/DSC03483.jpg` },                            // plateforme Sardine
  { nom: 'hsei-approche', source: `${OPERATIONS}/Mboumba/Mboumba - Réunion HSSE/DSC09324.jpg` },                                        // tableau HSSE et 10 Règles d'or
  { nom: 'distribution-station', source: 'Station/Inauguration de la station GabOil 1.png', zone: [0.12, 0.08, 0.84, 0.92] },          // pompe et boutique (l'ouverture reprend actu-gaboil-station)
  { nom: 'stations-hero', source: 'Station/Inauguration de la station GABOIL.png', zone: [0, 0, 1, 0.84] },                         // page des stations : station de Makokou, sans le titre incrusté
  { nom: 'services-hero', source: `${OPERATIONS}/Sardine/Sardine - Local électrique/DSC03872.jpg` },                                    // technicien devant une armoire électrique
  { nom: 'carrieres-hero', source: `${OPERATIONS}/Port-Gentil/POG - Travail d_équipe/DSC04221.jpg` },                              // collaboratrice et collègue au poste de travail, à droite (le texte de l'ouverture reste à gauche)
  { nom: 'carrieres-fierte', source: `${OPERATIONS}/Port-Gentil/POG - Travail d_équipe/DSC04499.jpg`, zone: [0.1, 0.04, 0.82, 0.82] },   // deux collègues relisent un document (« Rejoindre la SNHG »)
  { nom: 'carrieres-equipe', source: `${OPERATIONS}/Obangué/Obangué - Réunion d_équipe/DSC02637.jpg` },                                // réunion d'équipe (bande de candidature)
  { nom: 'services-intervention', source: 'SMP/SMP.webp' },                                                                          // technicien SMP sur un appareil de forage, main levée (photo fournie le 24/10/2026)
  // Images à la une et galeries des actualités (sources/actualites.json), au format 16:9 des cartes et des articles
  // GO’TALK : portraits des talents (sources/gotalk.json), recadrés en 4:5
  { nom: 'gotalk-axelle-manguiya-etoughe', source: 'GOTALK/axelle-manguiya-etoughe.png', format: 'talent' },
  { nom: 'gotalk-ingenieur-chimiste-mboumba', source: 'GOTALK/ingenieur-chimiste-mboumba.png', format: 'talent', zone: [0, 0, 1, 0.9] },   // casque gardé en entier
  { nom: 'gotalk-controleur-couts-senior', source: 'GOTALK/controleur-couts-senior.png', format: 'talent', zone: [0.31, 0, 0.51, 1] },   // photo en largeur : cadrée sur la personne
  { nom: 'actu-addax-tsiengui', source: `${OPERATIONS}/Tsiengui/Tsiengui - Vues aériennes/DJI_0299.jpg`, format: 'actualite' },
  { nom: 'actu-addax-obangue', source: `${OPERATIONS}/Obangué/Obangué - Installations/DSC01687.jpg`, format: 'actualite' },
  { nom: 'actu-smp', source: `${OPERATIONS}/Obangué/Obangué - Opérateur salle électrique/DSC01793.jpg`, format: 'actualite' },
  { nom: 'actu-gop', source: `${OPERATIONS}/Libreville/Libreville - Travail d_équipe/DSC04902.jpg`, format: 'actualite' },
  { nom: 'actu-gaboil-station', source: 'Station/Inauguration de la station GABOIL.png', format: 'actualite', zone: [0, 0, 1, 0.84] },   // sans le titre incrusté
];

const FORMATS = {
  paysage: { grande: [1536, 1024], petite: [768, 512] },
  portrait: { grande: [1024, 1536], petite: [768, 1152] },
  actualite: { grande: [1536, 864], petite: [768, 432] },
  talent: { grande: [960, 1200], petite: [768, 960] },
  bandeau: { grande: [2400, 1030], petite: [768, 330] },   // visuel déjà composé en bannière (2,33:1), gardé entier
};

// Les accents des noms de dossiers peuvent être enregistrés décomposés (copie depuis un Mac) :
// chaque élément du chemin est retrouvé en comparant les noms normalisés.
function retrouver(relatif) {
  let courant = SOURCE;
  for (const nom of relatif.split('/')) {
    const trouve = fs.readdirSync(courant).find((n) => n.normalize('NFC') === nom.normalize('NFC'));
    if (!trouve) throw new Error(`introuvable : ${nom} dans ${courant}`);
    courant = path.join(courant, trouve);
  }
  return courant;
}

const ffmpeg = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args]);

fs.rmSync(DST, { recursive: true, force: true });   // une photo retirée de la liste disparaît du site
fs.mkdirSync(DST, { recursive: true });
for (const p of PHOTOS) {
  const { grande: [L, H], petite: [l, h] } = FORMATS[p.format || 'paysage'];
  const zone = p.zone ? `crop=iw*${p.zone[2]}:ih*${p.zone[3]}:iw*${p.zone[0]}:ih*${p.zone[1]},` : '';
  const format = `crop='min(iw,ih*${L}/${H})':'min(ih,iw*${H}/${L})'`;
  ffmpeg(['-i', retrouver(p.source), '-filter_complex',
    `[0]${zone}${format},format=yuvj420p,split=2[a][b];[a]scale=${L}:${H}:flags=lanczos[g];[b]scale=${l}:${h}:flags=lanczos[v]`,
    '-map', '[g]', '-q:v', '4', '-map_metadata', '-1', path.join(DST, `${p.nom}.jpg`),
    '-map', '[v]', '-q:v', '4', '-map_metadata', '-1', path.join(DST, `${p.nom}-768.jpg`)]);
  console.log(`${p.nom.padEnd(28)} <- ${p.source}`);
}
console.log(`${PHOTOS.length} photos préparées dans img/photos/`);
