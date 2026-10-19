#!/usr/bin/env node
/**
 * Assemble les pages de la maquette : gabarit commun (en-tête, menus, pied de page) + contenu de chaque page.
 *
 *  sources/gabarit.html       squelette commun, avec des repères {{…}}
 *  sources/pages/<nom>.html   un commentaire JSON en tête (titre, description, onglet, precharger, css),
 *                             puis le contenu du <main>. Un repère <!-- apres --> facultatif sépare ce qui
 *                             se place après le pied de page (fenêtres modales).
 *
 * La navigation (menu principal, menu mobile, plan du site) est décrite une seule fois ci-dessous.
 * Seules les icônes réellement utilisées par une page sont ajoutées à son sprite.
 *
 * Actualités : sources/actualites.json décrit les articles (futurs articles WordPress) ; scripts/actualites.js
 * remplit les repères <!-- actualites:… --> des pages et écrit une page actualite-<slug>.html par article.
 *
 * Diaporama de l'accueil : sources/diaporama-accueil.json décrit les diapositives (futur bloc WordPress) ;
 * scripts/diaporama.js remplit le repère <!-- diaporama:accueil -->, et "precharger": "diaporama" précharge son premier fond.
 *
 * Sortie : maquette/<nom>.html
 * Usage  : node scripts/assembler-pages.js [--surveiller]
 */
const fs = require('fs');
const path = require('path');
const actualites = require('./actualites');
const diaporama = require('./diaporama');

const RACINE = path.join(__dirname, '..');
const SOURCES = path.join(RACINE, 'sources');
const SORTIE = path.join(RACINE, 'maquette');

/* Navigation du site : [libellé, lien]. Les pages encore à créer sont listées dans INVENTAIRE.md. */
const NAV = [
  { id: 'groupe', libelle: 'Présentation du groupe', pied: 'Le groupe', liens: [
    ['À propos', 'presentation-groupe.html#a-propos'],
    ['Missions', 'presentation-groupe.html#missions'],
    ['Vision et valeurs', 'presentation-groupe.html#vision-valeurs'],
    ['Gouvernance', 'historique-gouvernance.html#gouvernance'],
    ['Historique', 'historique-gouvernance.html#historique'],
    ['Filiales', 'filiales.html'],
  ] },
  { id: 'activites', libelle: 'Activités et engagements', pied: 'Activités', liens: [
    ['Exploration', 'exploration-production.html#exploration'],
    ['Production', 'exploration-production.html#production'],
    ['Projets stratégiques', 'projets-strategiques.html'],
    ['Engagements HSSE', 'activites-engagements.html#hsse'],
    ['RSE', 'activites-engagements.html#rse'],
  ] },
  { id: 'information', libelle: 'Information et contact', pied: 'Informations', liens: [
    ['Actualités', 'actualites.html'],
    ['Carrières', 'contact.html#candidature'],
    ['Contact', 'contact.html'],
  ] },
];

/* Liens légaux du bas de page */
const LEGAL = [
  ['Mentions légales', 'mentions-legales.html'],
  ['Politique de confidentialité', 'confidentialite.html'],
  ['Gestion des cookies', 'cookies.html'],
];

/* Icônes Lucide (24 × 24, trait) utilisées par les écrans Banani */
const ICONES = {
  'i-cible': '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  'i-tendance': '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  'i-feuille': '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
  'i-flamme': '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  'i-gouttes': '<path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/>',
  'i-eclair': '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  'i-lien-externe': '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  'i-foreuse': '<path d="M14 9c0 .6-.4 1-1 1H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8c.6 0 1 .4 1 1Z"/><path d="M18 6h4"/><path d="M14 4h3a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-3"/><path d="m5 10-2 8"/><path d="M12 10v3c0 .6-.4 1-1 1H8"/><path d="m7 18 2-8"/><path d="M5 22c-1.7 0-3-1.3-3-3 0-.6.4-1 1-1h7c.6 0 1 .4 1 1v2c0 .6-.4 1-1 1Z"/>',
  'i-usine': '<path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/>',
  'i-cle': '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  'i-coche-cercle': '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  'i-coche': '<path d="M20 6 9 17l-5-5"/>',
  'i-carte': '<path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/>',
  'i-bouclier': '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  'i-horloge': '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  'i-televerser': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
  'i-fleche-droite': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  'i-telecharger': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
  'i-livre': '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
};

const lien = (page) => ([texte, href]) => `<li><a href="${href}"${href === page ? ' aria-current="page"' : ''}>${texte}</a></li>`;

const navPrincipale = (page, onglet) => NAV.map((n) => `        <li class="nav-item">
          <button class="nav-onglet" type="button" aria-expanded="false" aria-controls="sous-menu-${n.id}"${n.id === onglet ? ' aria-current="true"' : ''}>${n.libelle} <svg class="chevron" aria-hidden="true"><use href="#i-chevron"/></svg></button>
          <div class="sous-menu" id="sous-menu-${n.id}">
            <ul class="sous-menu-liens">
${n.liens.map((l) => `              ${lien(page)(l)}`).join('\n')}
            </ul>
          </div>
        </li>
`).join('');

const navMobile = (page) => NAV.map((n) => `    <details class="accordeon" name="menu-mobile">
      <summary>${n.libelle} <svg class="chevron" aria-hidden="true"><use href="#i-chevron"/></svg></summary>
      <ul>
${n.liens.map((l) => `        ${lien(page)(l)}`).join('\n')}
      </ul>
    </details>
`).join('');

const piedColonnes = (page) => NAV.map((n) => `        <details class="pied-colonne" open>
          <summary>${n.pied} <svg class="chevron" aria-hidden="true"><use href="#i-chevron"/></svg></summary>
          <ul>
${n.liens.map((l) => `            ${lien(page)(l)}`).join('\n')}
          </ul>
        </details>
`).join('');

/* Image d'ouverture préchargée : photo en plusieurs largeurs (srcset) ou fichier unique */
const prechargement = (p) => {
  if (!p) return '';
  const variantes = p.srcset ? ` imagesrcset="${p.srcset}" imagesizes="${p.sizes || '100vw'}"` : '';
  return `  <link rel="preload" as="image" href="${p.src}"${variantes} fetchpriority="high">\n`;
};

function construire(gabarit, fichier, meta, contenu, apres = '') {
  const corps = contenu + apres;
  const icones = Object.keys(ICONES).filter((id) => corps.includes(`#${id}"`))
    .map((id) => `  <symbol id="${id}" viewBox="0 0 24 24">${ICONES[id]}</symbol>\n`).join('');
  const valeurs = {
    titre: meta.titre,
    description: meta.description,
    page: fichier,
    precharger: prechargement(meta.precharger),
    css: (meta.css || []).map((c) => `  <link rel="stylesheet" href="${c}">\n`).join(''),
    icones,
    'nav-principale': navPrincipale(fichier, meta.onglet),
    'nav-mobile': navMobile(fichier),
    'pied-colonnes': piedColonnes(fichier),
    'pied-legal': LEGAL.map((l) => `        ${lien(fichier)(l)}\n`).join(''),
    contenu,
    apres: apres ? '\n' + apres : '',
  };
  const html = gabarit.replace(/\{\{([a-z-]+)\}\}/g, (tout, cle) => {
    if (!(cle in valeurs)) throw new Error(`repère inconnu {{${cle}}}`);
    return valeurs[cle];
  });
  const cible = path.join(SORTIE, fichier);
  if (!fs.existsSync(cible) || fs.readFileSync(cible, 'utf8') !== html) fs.writeFileSync(cible, html);
}

function assembler() {
  const gabarit = fs.readFileSync(path.join(SOURCES, 'gabarit.html'), 'utf8');
  const actus = actualites.charger(SOURCES);
  const diapos = diaporama.charger(SOURCES);
  const pages = fs.readdirSync(path.join(SOURCES, 'pages')).filter((f) => f.endsWith('.html'));
  for (const fichier of pages) {
    const brut = fs.readFileSync(path.join(SOURCES, 'pages', fichier), 'utf8');
    const m = brut.match(/^<!--([\s\S]*?)-->\n/);
    if (!m) throw new Error(`${fichier} : commentaire JSON manquant en tête`);
    const meta = JSON.parse(m[1]);
    if (meta.precharger === 'diaporama') meta.precharger = diaporama.precharger(diapos);
    const [contenu, apres = ''] = brut.slice(m[0].length).split('<!-- apres -->\n');
    construire(gabarit, fichier, meta, diaporama.remplir(actualites.remplacer(contenu, actus), diapos), apres);
  }
  // Une page par article (modèle single.html) ; les pages d'articles retirés du fichier de données sont supprimées
  const articles = actus.articles.map((a) => {
    const { fichier, meta, contenu } = actualites.pageArticle(a, actus);
    construire(gabarit, fichier, meta, contenu);
    return fichier;
  });
  for (const f of fs.readdirSync(SORTIE)) {
    if (/^actualite-.+\.html$/.test(f) && !articles.includes(f)) fs.unlinkSync(path.join(SORTIE, f));
  }
  return [...pages, `${articles.length} articles`];
}

const pages = assembler();
console.log(`${pages.length} page(s) assemblée(s) : ${pages.join(', ')}`);

if (process.argv.includes('--surveiller')) {
  let minuterie;
  fs.watch(SOURCES, { recursive: true }, () => {
    clearTimeout(minuterie);
    minuterie = setTimeout(() => {
      try { assembler(); console.log(new Date().toLocaleTimeString('fr-FR'), 'pages reconstruites'); }
      catch (e) { console.error('Erreur :', e.message); }
    }, 120);
  });
  console.log('Surveillance de sources/ …');
}
