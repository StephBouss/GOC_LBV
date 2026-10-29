#!/usr/bin/env node
/**
 * Assemble les pages de la maquette : gabarit commun (en-tête, menus, pied de page) + contenu de chaque page, en français
 * (langue par défaut, à la racine du site) et en anglais (dossier en/).
 *
 *  sources/gabarit.html            squelette commun, avec des repères {{…}} ; ses textes ({{t:…}}) viennent de libelles.json
 *  sources/libelles.json           textes de l'interface dans chaque langue (gabarit et modèles générés)
 *  sources/navigation.json         menus dans chaque langue : menu principal, menu mobile, plan du pied de page, liens légaux
 *  sources/pages/<nom>.html        pages françaises : un commentaire JSON en tête (titre, description, onglet, parent,
 *                                  precharger, css, partage), puis le contenu du <main>. Un repère <!-- apres --> facultatif sépare ce
 *                                  qui se place après le pied de page (fenêtres modales).
 *  sources/en/pages/<nom>.html     pages anglaises, rangées sous leur adresse anglaise (group/about.html…). La clé « fr » de
 *                                  leur en-tête donne la page française qu'elles traduisent, comme une traduction liée dans
 *                                  Polylang : le sélecteur FR | EN, les liens hreflang et les menus s'en servent.
 *
 * Toute page ou tout article sans traduction arrête la génération : aucune page ne peut rester dans une seule langue.
 * (TRADUCTION_PARTIELLE=1 en fait un simple avertissement, pour un travail en cours.)
 * Dans une page traduite, chaque lien vers une page du site, écrit avec l'adresse française ou avec celle de la traduction,
 * mène à la version dans la langue de la page. Seules les icônes réellement utilisées par une page sont ajoutées à son sprite.
 *
 * Actualités : sources/actualites.json décrit les articles (futurs articles WordPress), sources/en/actualites.json leurs
 * traductions ; scripts/actualites.js remplit les repères <!-- actualites:… --> et écrit une page par article et par langue.
 *
 * Diaporama de l'accueil : sources/diaporama-accueil.json (et sa traduction dans sources/en/) décrit les diapositives
 * (futur bloc WordPress) ; scripts/diaporama.js remplit le repère <!-- diaporama:accueil -->, et "precharger": "diaporama"
 * précharge son premier fond.
 *
 * Médiathèque : sources/mediatheque.json (et sa traduction dans sources/en/) décrit les galeries (une par site) ;
 * scripts/mediatheque.js remplit les repères <!-- mediatheque:… --> (photos préparées par scripts/preparer-mediatheque.js).
 *
 * Stations Gab'Oil : sources/stations.json (et sa traduction dans sources/en/) décrit les stations-service ; scripts/stations.js
 * remplit les repères <!-- stations:… --> (carte du Gabon : sources/carte-gabon.json, produit par scripts/creer-carte-gabon.js).
 * GO’TALK : sources/gotalk.json (et sa traduction) décrit les portraits des talents ; scripts/gotalk.js remplit les repères
 * <!-- gotalk:… -->, y compris après <!-- apres --> (fenêtres des portraits).
 *
 * Rangement : chaque page est écrite à la même place que sa source (l'accueil à la racine du site, les autres dans le dossier
 * de leur rubrique : groupe/, filiales/, activites/…, et en/group/, en/activities/… pour l'anglais).
 * Dans les sources, liens et chemins s'écrivent depuis la racine du site de leur langue (« engagements/rse.html »,
 * « img/photos/… ») ; relocaliser() les rend relatifs à chaque page générée (« ../img/photos/… » dans un dossier de rubrique).
 *
 * Référencement : scripts/partage.js donne à chaque page ses balises canonical, hreflang et Open Graph (image de 1200 × 630 px
 * tirée de sa photo d'ouverture par scripts/preparer-partage.js), et écrit sitemap.xml et robots.txt à la racine.
 *
 * Sécurité : les en-têtes de sécurité sont déclarés dans vercel.json ; verifierScripts() s'assure que chaque script écrit
 * dans une page est autorisé par sa politique de contenu (Content-Security-Policy).
 *
 * Cache : versionner() ajoute à chaque fichier appelé par une page l'empreinte de son contenu (?ver=…), que vercel.json met
 * en cache longue durée. La surveillance régénère donc aussi les pages quand une image, un style ou un script change.
 *
 * Sortie : <rubrique>/<nom>.html, en/<rubrique>/<nom>.html, sitemap.xml et robots.txt, à côté de css/, js/, img/, video/,
 *          documents/ et fonts/
 * Usage  : node scripts/assembler-pages.js [--surveiller]
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const actualites = require('./actualites');
const diaporama = require('./diaporama');
const mediatheque = require('./mediatheque');
const stations = require('./stations');
const gotalk = require('./gotalk');
const partage = require('./partage');

const RACINE = path.join(__dirname, '..');
const SOURCES = path.join(RACINE, 'sources');
const SORTIE = RACINE;

/* Langues du site : le français à la racine (langue par défaut, comme dans Polylang), les autres dans leur dossier */
const LANGUES = ['fr', 'en'];
const DEFAUT = 'fr';
const NOMS_LANGUES = { fr: 'français', en: 'English' };
const prefixe = (langue) => (langue === DEFAUT ? '' : `${langue}/`);
const PARTIELLE = process.env.TRADUCTION_PARTIELLE === '1';

const lireJSON = (fichier) => JSON.parse(fs.readFileSync(fichier, 'utf8'));

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
  'i-repere': '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  'i-viseur': '<line x1="2" x2="5" y1="12" y2="12"/><line x1="19" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="5"/><line x1="12" x2="12" y1="19" y2="22"/><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/>',   // station la plus proche (accueil)
  'i-carte': '<path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/>',
  'i-bouclier': '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  'i-horloge': '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  'i-televerser': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
  'i-fleche-droite': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  'i-telecharger': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
  'i-chevron-gauche': '<path d="m15 18-6-6 6-6"/>',
  'i-chevron-droite': '<path d="m9 18 6-6-6-6"/>',
  'i-agrandir': '<path d="M15 3h6v6"/><path d="m21 3-7 7"/><path d="m3 21 7-7"/><path d="M9 21H3v-6"/>',
  'i-livre':'<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  // Engagements RSE : une icône par politique (poignée de main, balance, personnes, toque) ; l'environnement reprend i-feuille
  'i-mains': '<path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/>',
  'i-balance': '<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
  'i-personnes': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  'i-toque': '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
  // Engagements HSEI : conduite des véhicules et 10 Règles d'or (l'HSSE reprend i-bouclier, l'intégrité i-usine)
  'i-voiture': '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
  'i-medaille': '<path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/><circle cx="12" cy="8" r="6"/>',
  // Projets stratégiques : offshore, redémarrage, exploration, stockage, chantier, base-vie (forage et gaz reprennent i-foreuse et i-flamme)
  'i-navire': '<path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/><path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/><path d="M12 10v4"/><path d="M12 2v3"/>',
  'i-relance': '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  'i-boussole': '<path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/><circle cx="12" cy="12" r="10"/>',
  'i-reservoir': '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/>',
  'i-chantier': '<rect x="2" y="6" width="20" height="8" rx="1"/><path d="M17 14v7"/><path d="M7 14v7"/><path d="M17 3v3"/><path d="M7 3v3"/><path d="M10 14 2.3 6.3"/><path d="m14 6 7.7 7.7"/><path d="m8 6 8 8"/>',
  'i-maison': '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
};

/* Pictogrammes de la chaîne de valeur (page Filiales), d'après le visuel « One group » du groupe : grille de 64, trait.
   Le cercle est celui de la page (.maillon-icone, qui les rogne) : le sol et les conduites vont jusqu'à son bord, et le
   trait vertical qui sort par le bas prolonge celui qui relie les maillons. La classe p-plein masque ce qui est derrière. */
const PICTOGRAMMES = {
  // Amont : trois derricks, reliés sous le sol
  'p-amont': '<path d="M0 44h64"/><path d="M15 44v4q0 3 3 3h11q3 0 3 3v10M49 44v4q0 3-3 3H35q-3 0-3 3M32 44v10"/>'
    + '<path d="M25 44 30 12M39 44 34 12M29 12h6M30.5 12V8h3v4M26.6 34h10.8M28.1 24h7.8M25 44l12.4-10M39 44 26.6 34M26.6 34l9.3-10M37.4 34l-9.3-10"/>'
    + '<path d="M10 44 13.5 24M20 44 16.5 24M13 24h4M14 24v-3h2v3M11.75 34h6.5M10 44l8.25-10M20 44l-8.25-10M11.75 34 16.5 24M18.25 34 13.5 24"/>'
    + '<path d="M44 44 47.5 24M54 44 50.5 24M47 24h4M48 24v-3h2v3M45.75 34h6.5M44 44l8.25-10M54 44l-8.25-10M45.75 34 50.5 24M52.25 34 47.5 24"/>',
  // Services pétroliers amont : derrick et ateliers sur une plateforme
  'p-services': '<path d="M0 46h64M10 40h44M13 40v6M51 40v6M32 40v24"/>'
    + '<path d="M26 40 30 12M38 40 34 12M29 12h6M30.5 12V8h3v4M27.3 31h9.4M28.6 22h6.8M26 40l10.7-9M38 40 27.3 31M27.3 31l8.1-9M36.7 31l-8.1-9"/>'
    + '<path d="M14 40v-8h10v8M13 32h12M17.5 40v-4.5h3V40"/>'
    + '<path d="M40 40V27h10v13M47 27v-4h2v4M42.5 30h2v2h-2zM45.5 30h2v2h-2zM42.5 34h2v2h-2zM45.5 34h2v2h-2z"/>',
  // Intermédiaire : conduite et trois réservoirs
  'p-intermediaire': '<path d="M0 36 36 0M0 44 44 0M5.3 29.3l5.4 5.4M27.3 7.3l5.4 5.4M0 50h64M32 50v14"/>'
    + '<path class="p-plein" d="M16 18v10a6 2 0 0 0 12 0V18a6 2 0 0 0-12 0z"/><path d="M16 18a6 2 0 0 0 12 0"/>'
    + '<path class="p-plein" d="M22 26v14a8 2.5 0 0 0 16 0V26a8 2.5 0 0 0-16 0z"/><path d="M22 26a8 2.5 0 0 0 16 0"/>'
    + '<path class="p-plein" d="M31 33v14a11 3 0 0 0 22 0V33a11 3 0 0 0-22 0z"/><path d="M31 33a11 3 0 0 0 22 0M31 40a11 3 0 0 0 22 0"/>',
  // Aval : station-service et camion-citerne (dernier maillon : rien ne sort par le bas)
  'p-aval': '<path d="M0 46h64M7 16.5h19v3H7zM24 19.5V46"/>'
    + '<path d="M9 46V26h9v20M10.5 26v-2h6v2M11 29h5v4h-5zM18 30h1.5q2 0 2 2v8.5q0 1.5 1.5 1.5"/>'
    + '<path d="M32 28h11q3.5 0 3.5 3.5v5q0 3.5-3.5 3.5H32q-3.5 0-3.5-3.5v-5Q28.5 28 32 28zM28.5 40H59M48.5 40v-9h5.5l4.5 5v4M50.5 33h3l2.5 3h-5.5z"/>'
    + '<circle cx="34" cy="43" r="3"/><circle cx="53" cy="43" r="3"/>',
};

/* Menus : les liens sont écrits avec l'adresse française de la page (son identité) ; celui de la page courante est signalé.
   Dans une page traduite, traduireLiens() les fait ensuite mener aux traductions. */
// Libellés des menus : « & » écrit &amp; (« Actualités & Médias »), comme le fait WordPress
const html = (texte) => texte.replace(/&/g, '&amp;');
// « accent » : lien de sous-menu en rouge (« mise_en_avant », comme GO’TALK dans Carrières ; dans WordPress, une classe CSS)
const lien = (identite, texte, href, accent) => `<li><a ${accent ? 'class="nav-accent" ' : ''}href="${href}"${href === identite ? ' aria-current="page"' : ''}>${html(texte)}</a></li>`;
// Onglets sans sous-menu (« directs » de navigation.json ; aucun aujourd'hui) : un simple lien, souligné sur sa page,
// en rouge s'il est « mise_en_avant »
const directs = ({ identite, langue, navigation }, gabarit) => navigation.directs.map((l) => gabarit(`href="${l.lien}"${l.lien === identite ? ' aria-current="page"' : ''}`, html(l[langue]), l.mise_en_avant ? ' nav-accent' : '')).join('');

const navPrincipale = (contexte, onglet) => contexte.navigation.groupes.map((n) => navGroupe(contexte, n, onglet)).join('')
  + directs(contexte, (attributs, texte, accent) => `        <li class="nav-direct"><a class="nav-onglet${accent}" ${attributs}>${texte}</a></li>\n`);

const navGroupe = ({ identite, langue }, n, onglet) => `        <li class="nav-item">
          <button class="nav-onglet" type="button" aria-expanded="false" aria-controls="sous-menu-${n.id}"${n.id === onglet ? ' aria-current="true"' : ''}>${html(n.libelle[langue])} <svg class="chevron" aria-hidden="true"><use href="#i-chevron"/></svg></button>
          <div class="sous-menu" id="sous-menu-${n.id}">
            <ul class="sous-menu-liens">
${n.liens.map((l) => `              ${lien(identite, l[langue], l.lien, l.mise_en_avant)}`).join('\n')}
            </ul>
          </div>
        </li>
`;

const navMobile = (contexte) => contexte.navigation.groupes.map(({ libelle, liens }) => `    <details class="accordeon" name="menu-mobile">
      <summary>${html(libelle[contexte.langue])} <svg class="chevron" aria-hidden="true"><use href="#i-chevron"/></svg></summary>
      <ul>
${liens.map((l) => `        ${lien(contexte.identite, l[contexte.langue], l.lien, l.mise_en_avant)}`).join('\n')}
      </ul>
    </details>
`).join('') + directs(contexte, (attributs, texte, accent) => `    <a class="menu-mobile-direct${accent}" ${attributs}>${texte}</a>\n`);

// Les onglets directs ferment la colonne du groupe marqué « directs_au_pied »
const piedColonnes = ({ identite, langue, navigation }) => navigation.groupes.map((n) => `        <details class="pied-colonne" open>
          <summary>${html(n.pied[langue])} <svg class="chevron" aria-hidden="true"><use href="#i-chevron"/></svg></summary>
          <ul>
${[...n.liens, ...(n.directs_au_pied ? navigation.directs : [])].map((l) => `            ${lien(identite, l[langue], l.lien)}`).join('\n')}
          </ul>
        </details>
`).join('');

const piedLegal = ({ identite, langue, navigation }) => navigation.legal.map((l) => `        ${lien(identite, l[langue], l.lien)}\n`).join('');

/* Bande de navigation de la rubrique, sous l'en-tête (repère <!-- sous-nav --> dans la source de la page) : les liens du
   sous-menu de l'onglet de la page, avec les mêmes textes et dans le même ordre que le menu principal, la page courante
   signalée. Un lien vers une partie de la page elle-même devient une simple ancre (défilement sans rechargement), et la
   première de ces parties est signalée comme l'endroit où l'on se trouve. Une sous-page sans entrée de menu (« parent »
   de son en-tête : Stations Gab'Oil, sous Distribution et Lubrifiants) signale le lien de sa page parente.
   Dans WordPress : le même menu, affiché par le gabarit des pages de la rubrique. */
function sousNav({ identite, langue, navigation }, onglet, parent) {
  const n = navigation.groupes.find((g) => g.id === onglet);
  if (!n) throw new Error(`<!-- sous-nav --> : la page n'a pas d'onglet à sous-menu (« ${onglet} »)`);
  if (parent && !n.liens.some((l) => l.lien === parent)) throw new Error(`page parente absente du sous-menu « ${onglet} » : ${parent}`);
  let signalee = false;
  const element = (l) => {
    const [chemin, ancre] = l.lien.split('#');
    const texte = html(l[langue]);
    if (l.lien === parent) return `<li><a href="${l.lien}" aria-current="true">${texte}</a></li>`;
    if (chemin !== identite) return `<li><a href="${l.lien}">${texte}</a></li>`;
    if (!ancre) return `<li><a href="${l.lien}" aria-current="page">${texte}</a></li>`;
    const courant = signalee ? '' : ' aria-current="location"';
    signalee = true;
    return `<li><a href="#${ancre}"${courant}>${texte}</a></li>`;
  };
  return `  <nav class="sous-nav" aria-label="${html(n.libelle[langue])}">
    <ul>
${n.liens.map((l) => `      ${element(l)}`).join('\n')}
    </ul>
  </nav>`;
}

/* Sélecteur de langue (en-tête et menu mobile) : chaque langue mène à la version de la page courante dans cette langue.
   Le nom de la langue est lu dans cette langue (« FR (français) », « EN (English) »). */
function selecteurLangues({ langue, versions }, retrait) {
  const liens = LANGUES.map((l) => `<a href="${versions[l] || `${prefixe(l)}index.html`}" hreflang="${l}" lang="${l}"${l === langue ? ' aria-current="true"' : ''}>`
    + `${l.toUpperCase()}<span class="visuellement-masque"> (${NOMS_LANGUES[l]})</span></a>`);
  return `${retrait}<p class="langues">${liens.join(' <span aria-hidden="true">|</span> ')}</p>\n`;
}

/* Liens d'une page traduite : chaque lien vers une page du site (adresse française ou adresse de la traduction) mène à la
   version dans la langue de la page ; ancres et paramètres (#missions, ?categorie=…) sont conservés. */
function traduireLiens(html, fichier, { langue, toutesVersions, adresses }) {
  return html.replace(/\bhref="([^"#?]+\.html)([#?][^"]*)?"/g, (tout, cible, suite = '') => {
    if (/^(?:[a-z][a-z0-9+.-]*:|\/)/i.test(cible)) return tout;
    const traduite = (toutesVersions[cible] && toutesVersions[cible][langue])
      || (adresses.has(prefixe(langue) + cible) ? prefixe(langue) + cible : null);
    if (traduite) return `href="${traduite}${suite}"`;
    if (!PARTIELLE) throw new Error(`${fichier} : lien vers une page sans version « ${langue} » : ${cible}`);
    return tout;
  });
}

/* Chemins écrits depuis la racine du site → chemins relatifs à la page générée. Seuls les attributs qui portent une adresse
   sont concernés (pas type="video/mp4") ; ancres, adresses absolues (https:, mailto:, tel:, /…) et requêtes restent telles quelles. */
const ATTRIBUTS_URL = /\b(href|src|srcset|imagesrcset|poster|data-pdf|data-etiquettes)="([^"]*)"/g;
const relative = (u) => u && !/^(?:[a-z][a-z0-9+.-]*:|[#/?])/i.test(u);
// applique f à chaque adresse de ces attributs (à chacune des adresses d'un srcset)
const remplacerAdresses = (html, f) => html.replace(ATTRIBUTS_URL, (tout, attr, valeur) => `${attr}="${attr.endsWith('srcset')
  ? valeur.split(',').map((v) => v.trim().replace(/^\S+/, f)).join(', ')
  : f(valeur)}"`);
const relocaliser = (html, fichier) => {
  const prefixeDossier = '../'.repeat(fichier.split('/').length - 1);
  if (!prefixeDossier) return html;
  return remplacerAdresses(html, (u) => (relative(u) ? prefixeDossier + u : u));
};

/* Cache du navigateur : chaque fichier appelé par une page (image, vidéo, PDF, feuille de style, script) porte l'empreinte de
   son contenu, « img/photos/accueil.jpg?ver=3fa9c1d2e4 », comme le ?ver= que WordPress ajoute aux fichiers de son thème.
   vercel.json laisse le navigateur garder un an les adresses ?ver= sans les redemander : un fichier inchangé ne se recharge
   plus d'une page à l'autre ni d'un envoi à l'autre, et un fichier modifié change d'adresse. Les polices restent sans
   version : leur préchargement (gabarit) doit garder l'adresse que donne la feuille de style, qui n'est pas générée. */
const VERSIONNES = /\.(?:jpe?g|png|webp|svg|ico|mp4|webm|pdf|css|js)$/i;
let empreintes = new Map();   // vidée à chaque génération : un fichier a pu changer entre deux
const versionner = (html) => remplacerAdresses(html, (u) => {
  if (!relative(u) || !VERSIONNES.test(u)) return u;
  const fichier = path.join(SORTIE, u);
  if (!empreintes.has(fichier)) {
    empreintes.set(fichier, fs.existsSync(fichier) ? crypto.createHash('sha256').update(fs.readFileSync(fichier)).digest('hex').slice(0, 10) : '');
  }
  return empreintes.get(fichier) ? `${u}?ver=${empreintes.get(fichier)}` : u;
});

/* Image d'ouverture préchargée : photo en plusieurs largeurs (srcset) ou fichier unique */
const prechargement = (p) => {
  if (!p) return '';
  const variantes = p.srcset ? ` imagesrcset="${p.srcset}" imagesizes="${p.sizes || '100vw'}"` : '';
  return `  <link rel="preload" as="image" href="${p.src}"${variantes} fetchpriority="high">\n`;
};

/* Écrit un fichier seulement s'il change : le rechargement automatique du navigateur ne se déclenche pas pour rien */
const ecrire = (fichier, texte) => {
  const cible = path.join(SORTIE, fichier);
  fs.mkdirSync(path.dirname(cible), { recursive: true });
  if (!fs.existsSync(cible) || fs.readFileSync(cible, 'utf8') !== texte) fs.writeFileSync(cible, texte);
};

/* Sécurité : la politique de contenu de vercel.json (Content-Security-Policy) n'autorise un script écrit dans la page que
   par son empreinte SHA-256, et aucun attribut onclick, onload… Un script en ligne ajouté ou modifié sans mettre à jour
   l'empreinte dans vercel.json serait bloqué en ligne : la génération s'arrête et donne l'empreinte à déclarer. */
function verifierScripts(html, fichier) {
  const config = lireJSON(path.join(RACINE, 'vercel.json'));
  const politique = ((config.headers || []).flatMap((r) => r.headers).find((h) => h.key === 'Content-Security-Policy') || {}).value || '';
  for (const [, code] of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
    const empreinte = `'sha256-${crypto.createHash('sha256').update(code, 'utf8').digest('base64')}'`;
    if (!politique.includes(empreinte)) throw new Error(`${fichier} : script en ligne non autorisé, ajouter ${empreinte} à script-src dans vercel.json`);
  }
  const gestionnaire = html.match(/<[^>]*\son[a-z]+="[^>]*>/);
  if (gestionnaire) throw new Error(`${fichier} : attribut de script interdit par la politique de contenu : ${gestionnaire[0].slice(0, 80)}`);
}

/* Image d'aperçu : celle tirée de la photo de la page si elle a été préparée, sinon l'image par défaut */
const imagePartage = (meta, contenu) => {
  const image = partage.source(meta, contenu);
  const prevue = image && partage.cible(image.src);
  return prevue && fs.existsSync(path.join(SORTIE, prevue)) ? prevue : partage.cible(partage.IMAGE_DEFAUT.src);
};

/* contexte : langue de la page, identité (adresse de la page française), versions de la page dans chaque langue,
   textes de l'interface (t), menus, et toutes les versions du site (pour traduire les liens) */
function construire(gabarit, fichier, meta, source, apres, contexte) {
  const { langue, t } = contexte;
  const contenu = source.replace(/^[ \t]*<!-- sous-nav -->/m, () => sousNav(contexte, meta.onglet, meta.parent));
  const corps = contenu + apres;
  const symboles = (dessins, vue) => Object.keys(dessins).filter((id) => corps.includes(`#${id}"`))
    .map((id) => `  <symbol id="${id}" viewBox="${vue}">${dessins[id]}</symbol>\n`).join('');
  const icones = symboles(ICONES, '0 0 24 24') + symboles(PICTOGRAMMES, '0 0 64 64');
  const valeurs = {
    langue,
    titre: meta.titre,
    description: meta.description,
    partage: partage.balises(fichier, meta, imagePartage(meta, contenu), langue, contexte.versions),
    precharger: prechargement(meta.precharger),
    css: (meta.css || []).map((c) => `  <link rel="stylesheet" href="${c}">\n`).join(''),
    icones,
    // sélecteur de langue : posé après la traduction des liens, qui ne doit pas le toucher
    'langues-entete': '{{langues-entete}}',
    'langues-menu': '{{langues-menu}}',
    'nav-principale': navPrincipale(contexte, meta.onglet),
    'nav-mobile': navMobile(contexte),
    'pied-colonnes': piedColonnes(contexte),
    'pied-legal': piedLegal(contexte),
    contenu,
    apres: apres ? '\n' + apres : '',
  };
  let html = gabarit.replace(/\{\{(t:)?([a-z-]+)\}\}/g, (tout, texte, cle) => {
    const source = texte ? t : valeurs;
    if (!(cle in source)) throw new Error(`${texte ? 'texte' : 'repère'} inconnu {{${texte || ''}${cle}}} (${langue})`);
    return source[cle];
  });
  if (langue !== DEFAUT) html = traduireLiens(html, fichier, contexte);
  html = html.replace(/\{\{langues-(entete|menu)\}\}/g, (tout, ou) => selecteurLangues(contexte, ou === 'entete' ? '      ' : '    '));
  verifierScripts(html, fichier);
  ecrire(fichier, relocaliser(versionner(html), fichier));
}

/* Sources des pages d'une langue : chemins relatifs à son dossier pages/, écrits avec « / » quel que soit le système */
function lirePages(langue) {
  const dossier = path.join(SOURCES, prefixe(langue), 'pages');
  if (!fs.existsSync(dossier)) return [];
  return fs.readdirSync(dossier, { recursive: true }).map((f) => f.split(path.sep).join('/')).filter((f) => f.endsWith('.html')).sort()
    .map((rel) => {
      const brut = fs.readFileSync(path.join(dossier, rel), 'utf8');
      const m = brut.match(/^<!--([\s\S]*?)-->\n/);
      if (!m) throw new Error(`${prefixe(langue)}pages/${rel} : commentaire JSON manquant en tête`);
      const meta = JSON.parse(m[1]);
      const identite = langue === DEFAUT ? rel : meta.fr;
      if (!identite) throw new Error(`${langue}/pages/${rel} : clé « fr » manquante (adresse de la page française traduite)`);
      return { langue, fichier: prefixe(langue) + rel, identite, meta, corps: brut.slice(m[0].length) };
    });
}

function assembler() {
  empreintes = new Map();
  const gabarit = fs.readFileSync(path.join(SOURCES, 'gabarit.html'), 'utf8');
  const libelles = lireJSON(path.join(SOURCES, 'libelles.json'));
  const navigation = lireJSON(path.join(SOURCES, 'navigation.json'));
  const pages = LANGUES.flatMap(lirePages);
  const donnees = Object.fromEntries(LANGUES.map((l) => [l, {
    actus: actualites.charger(SOURCES, l, libelles[l]),
    diapos: diaporama.charger(SOURCES, l, libelles[l]),
    galeries: mediatheque.charger(SOURCES, l, libelles[l]),
    reseau: stations.charger(SOURCES, l),
    equipe: gotalk.charger(SOURCES, l),
  }]));

  // Versions de chaque page et de chaque article, repérées par l'adresse française : { 'groupe/presentation.html': { fr, en } }
  const versions = {};
  const ajouter = (identite, langue, fichier) => { versions[identite] = { ...versions[identite], [langue]: fichier }; };
  for (const p of pages) {
    if (p.langue !== DEFAUT && !pages.some((x) => x.langue === DEFAUT && x.fichier === p.identite)) {
      throw new Error(`${p.fichier} : « fr » désigne une page française inconnue (${p.identite})`);
    }
    ajouter(p.identite, p.langue, p.fichier);
  }
  for (const langue of LANGUES) {
    const liste = versions['actualites/index.html'] && versions['actualites/index.html'][langue];
    const dossier = path.posix.dirname(liste || `${prefixe(langue)}actualites/index.html`);
    for (const a of donnees[langue].actus.articles) {
      ajouter(actualites.lienArticle(a), langue, langue === DEFAUT ? actualites.lienArticle(a) : `${dossier}/${a.slugTraduit}.html`);
    }
  }
  const manquantes = Object.entries(versions).filter(([, v]) => LANGUES.some((l) => !v[l]))
    .map(([identite, v]) => `${identite} (manque : ${LANGUES.filter((l) => !v[l]).join(', ')})`);
  if (manquantes.length) {
    const message = `${manquantes.length} page(s) sans traduction :\n  ${manquantes.join('\n  ')}`;
    if (!PARTIELLE) throw new Error(message);
    console.warn(`Avertissement : ${message}`);
  }
  const adresses = new Set(Object.values(versions).flatMap((v) => Object.values(v)));
  const contexte = (langue, identite) => ({ langue, identite, versions: versions[identite], t: libelles[langue], navigation, toutesVersions: versions, adresses });

  for (const p of pages) {
    const { actus, diapos, galeries, reseau, equipe } = donnees[p.langue];
    if (p.meta.precharger === 'diaporama') p.meta.precharger = diaporama.precharger(diapos);
    const [contenu, apres = ''] = p.corps.split('<!-- apres -->\n');
    construire(gabarit, p.fichier, p.meta, gotalk.remplir(stations.remplir(mediatheque.remplir(diaporama.remplir(actualites.remplacer(contenu, actus), diapos), galeries), reseau), equipe), gotalk.remplir(apres, equipe), contexte(p.langue, p.identite));
  }
  // Une page par article et par langue (modèle single.html) ; les pages d'articles retirés du fichier de données sont supprimées
  const articles = [];
  for (const langue of LANGUES) {
    for (const a of donnees[langue].actus.articles) {
      const { fichier: identite, meta, contenu } = actualites.pageArticle(a, donnees[langue].actus);
      construire(gabarit, versions[identite][langue], meta, contenu, '', contexte(langue, identite));
      articles.push(versions[identite][langue]);
    }
  }
  for (const dossier of new Set(articles.map((f) => path.posix.dirname(f)))) {
    for (const f of fs.readdirSync(path.join(SORTIE, dossier))) {
      if (f.endsWith('.html') && f !== 'index.html' && !articles.includes(`${dossier}/${f}`)) fs.unlinkSync(path.join(SORTIE, dossier, f));
    }
  }
  ecrire('sitemap.xml', partage.plan([...pages.map((p) => p.fichier), ...articles]));
  ecrire('robots.txt', partage.robots());
  return LANGUES.map((l) => `${l} : ${pages.filter((p) => p.langue === l).length} pages et ${donnees[l].actus.articles.length} articles`);
}

/* Le thème WordPress (scripts/wordpress/construire.js) reprend les icônes, les pictogrammes et la lecture des pages */
module.exports = { ICONES, PICTOGRAMMES, LANGUES, DEFAUT, prefixe, lirePages };

if (require.main === module) {
const bilan = assembler();
console.log(`Pages assemblées (${bilan.join(' ; ')})`);

if (process.argv.includes('--surveiller')) {
  let minuterie;
  const reconstruire = () => {
    clearTimeout(minuterie);
    minuterie = setTimeout(() => {
      try { assembler(); console.log(new Date().toLocaleTimeString('fr-FR'), 'pages reconstruites'); }
      catch (e) { console.error('Erreur :', e.message); }
    }, 120);
  };
  // Les sources, et les fichiers appelés par les pages : un fichier modifié change d'empreinte, donc d'adresse (?ver=…).
  // Windows signale aussi les simples lectures, dont celles de versionner() : seule une date de modification qui avance compte.
  const DEMARRAGE = Date.now();
  const DATES = new Map();
  const DOSSIERS = ['sources', 'css', 'js', 'img', 'video', 'documents'];
  for (const dossier of DOSSIERS) {
    fs.watch(path.join(RACINE, dossier), { recursive: true }, (type, nom) => {
      if (!nom) return reconstruire();
      const fichier = path.join(RACINE, dossier, nom);
      fs.stat(fichier, (err, st) => {
        if (err) return reconstruire();                 // fichier supprimé ou renommé
        if (st.isDirectory()) return;
        if (st.mtimeMs > (DATES.get(fichier) ?? DEMARRAGE)) { DATES.set(fichier, st.mtimeMs); reconstruire(); }
      });
    });
  }
  console.log(`Surveillance de ${DOSSIERS.map((d) => `${d}/`).join(', ')} …`);
}
}
