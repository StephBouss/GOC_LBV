#!/usr/bin/env node
/**
 * Thème WordPress « snhg » et contenus à importer, tirés des mêmes sources que le site statique.
 *
 *  1. Thème : copie wordpress/snhg/ (gabarits PHP) et les fichiers du site (css/, js/, img/, video/, fonts/, documents/)
 *     dans wp-content/themes/snhg/ du WordPress visé, puis écrit dans son dossier donnees/ ce que les gabarits PHP lisent :
 *     textes de l'interface (libelles.json), icônes et pictogrammes de l'assembleur, fond de carte et textes des stations.
 *  2. Contenus : écrit wp-content/uploads/snhg-import/contenus.json, que lit wordpress/snhg/inc/importer.php :
 *     pages (FR et EN, liées comme des traductions Polylang), articles et catégories, diapositives de l'accueil,
 *     stations Gab'Oil, menus, et la liste des fichiers à verser dans la médiathèque de WordPress.
 *
 * Contenu des pages : le <main> de chaque source, découpé en blocs « HTML personnalisé » (un par partie de la page,
 * aux commentaires « ═══ ») ; les repères des modèles deviennent des codes courts ([snhg_diaporama],
 * [snhg_actualites vue="accueil"], [snhg_stations vue="carte"]…) rendus par le thème, et <!-- sous-nav --> un bloc
 * [snhg_sous_nav]. Dans les adresses, {{theme}} désigne le dossier du thème (fichiers du site, avec leur ?ver=),
 * {{page:<langue>:<page française>}} et {{article:<langue>:<slug français>}} une page ou un article, remplacés par leur
 * adresse WordPress à l'import.
 *
 * Usage : node scripts/wordpress/construire.js [dossier du WordPress]   (par défaut C:/xampp/htdocs/website_SNHG)
 *         puis C:/xampp/php/php.exe scripts/wordpress/importer.php [dossier du WordPress]
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { ICONES, PICTOGRAMMES, LANGUES, DEFAUT, prefixe, lirePages } = require('../assembler-pages');
const actualites = require('../actualites');
const diaporama = require('../diaporama');
const stations = require('../stations');
const mediatheque = require('../mediatheque');
const gotalk = require('../gotalk');

const RACINE = path.join(__dirname, '..', '..');
const SOURCES = path.join(RACINE, 'sources');
const WORDPRESS = path.resolve(process.argv[2] || 'C:/xampp/htdocs/website_SNHG');
const THEME = path.join(WORDPRESS, 'wp-content', 'themes', 'snhg');
const IMPORT = path.join(WORDPRESS, 'wp-content', 'uploads', 'snhg-import');
const FICHIERS_DU_SITE = ['css', 'js', 'img', 'video', 'fonts', 'documents'];

const lireJSON = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));

/* ─── 1. Thème ─── */

// Copie un dossier en ne recopiant que les fichiers modifiés (les vidéos et photos pèsent plus de 50 Mo)
function copier(source, cible) {
  let copies = 0;
  for (const nom of fs.readdirSync(source, { recursive: true })) {
    const de = path.join(source, nom);
    const vers = path.join(cible, nom);
    const st = fs.statSync(de);
    if (st.isDirectory()) continue;
    if (fs.existsSync(vers)) {
      const deja = fs.statSync(vers);
      if (deja.size === st.size && deja.mtimeMs >= st.mtimeMs) continue;
    }
    fs.mkdirSync(path.dirname(vers), { recursive: true });
    fs.copyFileSync(de, vers);
    copies++;
  }
  return copies;
}

function construireTheme() {
  let copies = copier(path.join(RACINE, 'wordpress', 'snhg'), THEME);
  for (const d of FICHIERS_DU_SITE) copies += copier(path.join(RACINE, d), path.join(THEME, d));
  const donnees = path.join(THEME, 'donnees');
  fs.mkdirSync(donnees, { recursive: true });
  const libelles = lireJSON(path.join(SOURCES, 'libelles.json'));
  delete libelles._lisezmoi;
  // Textes des stations (états, filtres, noms de la carte) : les stations elles-mêmes sont des contenus WordPress
  const textesStations = Object.fromEntries(LANGUES.map((l) => {
    const d = stations.charger(SOURCES, l);
    return [l, { etats: d.etats, textes: d.textes, carte: d.carte }];
  }));
  const fond = lireJSON(path.join(SOURCES, 'carte-gabon.json'));
  delete fond._lisezmoi;
  const ecrire = (nom, valeur) => fs.writeFileSync(path.join(donnees, nom), JSON.stringify(valeur));
  ecrire('libelles.json', libelles);
  ecrire('icones.json', { icones: ICONES, pictogrammes: PICTOGRAMMES });
  ecrire('stations.json', textesStations);
  ecrire('carte-gabon.json', fond);
  ecrire('gotalk.json', Object.fromEntries(LANGUES.map((l) => [l, gotalk.charger(SOURCES, l).textes])));
  return copies;
}

/* ─── 2. Contenus ─── */

const VERSIONNES = /\.(?:jpe?g|png|webp|svg|ico|mp4|webm|pdf|css|js)$/i;
const empreintes = new Map();
const version = (u) => {
  if (!VERSIONNES.test(u)) return '';
  if (!empreintes.has(u)) {
    const f = path.join(RACINE, u);
    empreintes.set(u, fs.existsSync(f) ? crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex').slice(0, 10) : '');
  }
  return empreintes.get(u) ? `?ver=${empreintes.get(u)}` : '';
};
const relative = (u) => u && !/^(?:[a-z][a-z0-9+.-]*:|[#/?{])/i.test(u);

/* Pages et articles de chaque langue, repérés par l'adresse française (comme dans l'assembleur) */
const pages = LANGUES.flatMap(lirePages);
const libelles = lireJSON(path.join(SOURCES, 'libelles.json'));
const donnees = Object.fromEntries(LANGUES.map((l) => [l, {
  actus: actualites.charger(SOURCES, l, libelles[l]),
  diapos: diaporama.charger(SOURCES, l, libelles[l]),
  reseau: stations.charger(SOURCES, l),
  galeries: mediatheque.charger(SOURCES, l, libelles[l]),
  equipe: gotalk.charger(SOURCES, l),
}]));
// fichier d'une langue (« en/group/about.html ») → identité (« groupe/presentation.html »)
const identites = new Map(pages.map((p) => [p.fichier, p.identite]));
const articlesFr = new Set(donnees[DEFAUT].actus.articles.map((a) => actualites.lienArticle(a)));
for (const l of LANGUES.filter((x) => x !== DEFAUT)) {
  const dossier = path.posix.dirname(pages.find((p) => p.langue === l && p.identite === 'actualites/index.html').fichier);
  for (const a of donnees[l].actus.articles) identites.set(`${dossier}/${a.slugTraduit}.html`, actualites.lienArticle(a));
}

/* Adresse d'une page ou d'un article dans une langue, écrite dans une source de cette langue */
function jeton(cible, langue, origine) {
  const identite = identites.has(prefixe(langue) + cible) && langue !== DEFAUT ? identites.get(prefixe(langue) + cible) : cible;
  if (articlesFr.has(identite)) return `{{article:${langue}:${path.posix.basename(identite, '.html')}}}`;
  if (!pages.some((p) => p.identite === identite)) throw new Error(`${origine} : lien vers une page inconnue : ${cible}`);
  return `{{page:${langue}:${identite}}}`;
}

const ATTRIBUTS_URL = /\b(href|src|srcset|imagesrcset|poster|data-pdf|data-etiquettes)="([^"]*)"/g;
function adresses(html, langue, origine) {
  const une = (u) => {
    if (!relative(u)) return u;
    const m = u.match(/^([^#?]+\.html)([#?].*)?$/);
    if (m) return jeton(m[1], langue, origine) + (m[2] || '');
    return `{{theme}}/${u}${version(u.split(/[?#]/)[0])}`;
  };
  return html.replace(ATTRIBUTS_URL, (tout, attr, valeur) => `${attr}="${attr.endsWith('srcset')
    ? valeur.split(',').map((v) => v.trim().replace(/^\S+/, une)).join(', ')
    : une(valeur)}"`);
}

/* Repères des modèles → codes courts du thème */
const CODES = [
  [/<!-- diaporama:accueil -->/g, '[snhg_diaporama]'],
  [/<!-- (actualites|stations|mediatheque|gotalk):([a-z]+) -->/g, '[snhg_$1 vue="$2"]'],
  [/\{\{actualites:nombre\}\}/g, '[snhg_actualites vue="nombre"]'],
  [/\{\{stations:(total|service|construction|etudes)\}\}/g, '[snhg_stations nombre="$1"]'],
  [/\{\{mediatheque:(galeries|photos)\}\}/g, '[snhg_mediatheque nombre="$1"]'],
];
const codesCourts = (html) => CODES.reduce((h, [motif, code]) => h.replace(motif, code), html);

const blocHTML = (html) => `<!-- wp:html -->\n${html.replace(/^\n+|\s+$/g, '')}\n<!-- /wp:html -->`;
const blocCode = (code) => `<!-- wp:shortcode -->\n${code}\n<!-- /wp:shortcode -->`;

/* Contenu d'une page : un bloc par partie (commentaire « ═══ » à la marge de la page), la bande de rubrique à part,
   puis ce qui se place après le pied de page (fenêtres), derrière le repère <!-- snhg:apres --> */
function blocs(corps, langue, origine) {
  const [contenu, apres = ''] = corps.split('<!-- apres -->\n');
  const parties = [];
  let courante = [];
  const fermer = () => { if (courante.join('').trim()) parties.push(blocHTML(courante.join('\n'))); courante = []; };
  for (const ligne of contenu.split('\n')) {
    if (/^[ \t]*<!-- sous-nav -->\s*$/.test(ligne)) { fermer(); parties.push(blocCode('[snhg_sous_nav]')); continue; }
    if (/^  <!-- ═/.test(ligne)) fermer();
    courante.push(ligne);
  }
  fermer();
  if (apres.trim()) parties.push(blocHTML(`<!-- snhg:apres -->\n${apres}`));
  return adresses(codesCourts(parties.join('\n\n')), langue, origine);
}

/* Chemin WordPress d'une page : « groupe/presentation.html » → groupe/presentation, « filiales/index.html » → filiales.
   Les pages anglaises reprennent leur adresse sous en/ ; deux adresses identiques au même niveau (« contact »,
   « gotalk ») ne peuvent coexister dans WordPress sans Polylang Pro : l'anglaise prend un autre nom. */
const RENOMMEES = { en: { contact: 'contact-us', gotalk: 'go-talk' } };
function chemin(p) {
  const rel = p.fichier.slice(prefixe(p.langue).length).replace(/\.html$/, '').replace(/(^|\/)index$/, '');
  const segments = rel ? rel.split('/') : [];
  if (segments.length && RENOMMEES[p.langue] && RENOMMEES[p.langue][segments[0]]) segments[0] = RENOMMEES[p.langue][segments[0]];
  return segments;
}
// Rubriques sans page d'accueil propre : une page parente, qui renvoie vers sa première page
const RUBRIQUES = {
  fr: { groupe: 'Le groupe', engagements: 'Engagements', 'informations-legales': 'Informations légales' },
  en: { group: 'The Group', commitments: 'Commitments', legal: 'Legal information' },
};

const texteBrut = (html) => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

function exporterPages() {
  const navigation = lireJSON(path.join(SOURCES, 'navigation.json'));
  const ordreMenus = [...navigation.groupes.flatMap((g) => g.liens), ...navigation.directs, ...navigation.legal].map((l) => l.lien);
  const liste = pages.map((p) => {
    const h1 = p.corps.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    return {
      cle: `${p.langue}:${p.identite}`,
      langue: p.langue,
      identite: p.identite,
      chemin: chemin(p),
      titre: p.identite === 'index.html' ? { fr: 'Accueil', en: 'Home' }[p.langue] : texteBrut(h1 ? h1[1] : p.meta.titre),
      meta: { titre: p.meta.titre, description: p.meta.description, onglet: p.meta.onglet || '', precharger: p.meta.precharger || null, css: p.meta.css || [], partage: p.meta.partage || null },
      contenu: blocs(p.corps, p.langue, p.fichier),
    };
  });
  // Pages des rubriques sans page propre, placées avant leurs pages
  const parents = [];
  for (const [langue, rubriques] of Object.entries(RUBRIQUES)) {
    for (const [segment, titre] of Object.entries(rubriques)) {
      const enfants = liste.filter((p) => p.langue === langue && p.chemin.length > 1 && p.chemin[0] === segment);
      if (!enfants.length) throw new Error(`rubrique ${langue}:${segment} sans page`);
      // la première dans l'ordre des menus (Présentation avant Historique)
      const rang = (p) => { const i = ordreMenus.findIndex((l) => l.startsWith(p.identite)); return i < 0 ? Infinity : i; };
      const premiere = [...enfants].sort((a, b) => rang(a) - rang(b))[0];
      const identite = `${premiere.identite.split('/')[0]}/`;
      parents.push({ cle: `${langue}:${identite}`, langue, identite, chemin: [segment], titre, redirection: premiere.cle, meta: { titre, description: '', onglet: '', precharger: null, css: [], partage: null }, contenu: '' });
    }
  }
  // Parentes d'abord : une page se crée sous sa rubrique (« activites/index.html » avant « activites/distribution… »)
  const tout = [...parents, ...liste].sort((x, y) => x.chemin.length - y.chemin.length);
  for (const p of tout) {
    if (p.chemin.length > 1 && !tout.some((x) => x.langue === p.langue && x.chemin.join('/') === p.chemin.slice(0, -1).join('/'))) {
      throw new Error(`${p.cle} : page parente manquante (${p.chemin.slice(0, -1).join('/')})`);
    }
  }
  const vus = new Map();
  for (const p of tout) {
    const c = p.chemin.join('/') || `(accueil ${p.langue})`;   // accueil : adresse « accueil » ou « home » dans WordPress
    if (vus.has(c)) throw new Error(`adresse « ${c} » en double : ${vus.get(c)} et ${p.cle}`);
    vus.set(c, p.cle);
  }
  return tout;
}

const medias = new Map();   // fichier du site → texte alternatif par défaut
const media = (fichier, alt = '') => {
  if (!fichier) return null;
  if (!fs.existsSync(path.join(RACINE, fichier))) throw new Error(`fichier introuvable : ${fichier}`);
  if (!medias.has(fichier) || (!medias.get(fichier) && alt)) medias.set(fichier, alt);
  return fichier;
};
const fichierImage = (img) => (img.src.endsWith('.svg') ? img.src : `${img.src}.jpg`);

function exporterArticles() {
  const articles = [];
  for (const langue of LANGUES) {
    for (const a of donnees[langue].actus.articles) {
      articles.push({
        cle: a.slug,
        langue,
        slug: langue === DEFAUT ? a.slug : a.slugTraduit,
        titre: a.titre,
        extrait: a.extrait,
        date: a.date,
        categorie: a.categorie,
        image: { fichier: media(fichierImage(a.image), langue === DEFAUT ? a.image.alt : ''), alt: a.image.alt || '', position: a.image.position || '', largeur: a.image.largeur, hauteur: a.image.hauteur },
        galerie: (a.galerie || []).map((g) => ({ fichier: media(fichierImage(g), langue === DEFAUT ? g.alt : ''), alt: g.alt || '', largeur: g.largeur, hauteur: g.hauteur })),
        contenu: a.contenu.map((p) => adresses(p.replace(/href='/g, 'href="'), langue, `article ${a.slug}`)),
      });
    }
  }
  const categories = donnees[DEFAUT].actus.categories.map((c) => ({
    cle: c.slug, ...Object.fromEntries(LANGUES.map((l) => [l, donnees[l].actus.categories.find((x) => x.slug === c.slug).nom])),
  }));
  return { articles, categories };
}

function exporterDiapositives() {
  return LANGUES.flatMap((langue) => donnees[langue].diapos.diapositives.map((d, i) => {
    const f = d.fond;
    const fond = f.type === 'video'
      ? { type: 'video', mp4: media(f.src), webm: media(f.webm), affiche: media(f.affiche), mobile_mp4: media(f.mobile && f.mobile.src), mobile_webm: media(f.mobile && f.mobile.webm) }
      : { type: 'photo', photo: media(`${f.src}.jpg`) };
    return {
      cle: d.id, langue, ordre: i + 1, duree: d.duree, sur_titre: d.surTitre, titre: d.titre, chapo: d.chapo,
      boutons: d.boutons.map((b) => ({ texte: b.texte, lien: adresses(`href="${b.lien}"`, langue, `diapositive ${d.id}`).slice(6, -1), style: b.style })),
      fond,
    };
  }));
}

/* Stations : mêmes fiches en français et en anglais (noms propres) ; seuls les textes de la carte se traduisent (thème) */
const exporterStations = () => donnees[DEFAUT].reseau.stations.map((s, i) => ({
  cle: s.id, ordre: i + 1, nom: s.nom, ville: s.ville || '', province: s.province || '', etat: s.etat,
  lat: typeof s.lat === 'number' ? s.lat : null, lon: typeof s.lon === 'number' ? s.lon : null,
  provisoire: s.position === 'provisoire', photo: media(s.photo),
}));

/* Galeries de la médiathèque : la grande version de chaque photo (WordPress en tire les autres tailles) */
const exporterGaleries = () => LANGUES.flatMap((langue) => donnees[langue].galeries.galeries.map((g, i) => ({
  cle: g.slug, langue, ordre: i + 1, titre: g.titre, type: g.type, description: g.description,
  photos: g.photos.map((p) => ({ fichier: media(p.grande, langue === DEFAUT ? p.alt : ''), alt: p.alt })),
})));

/* Portraits GO’TALK : les réponses de l'entretien gardent leurs paragraphes, séparés par une ligne vide */
const exporterTalents = () => LANGUES.flatMap((langue) => donnees[langue].equipe.talents.map((t, i) => ({
  cle: t.id, langue, ordre: i + 1, nom: t.nom || '', fonction: t.fonction, service: t.service, alt: t.alt, titre: t.titre, chapo: t.chapo,
  photo: media(`${t.photo}.jpg`, langue === DEFAUT ? t.alt : ''),
  entretien: t.entretien.map((q) => ({ question: q.question, accroche: q.accroche || '', reponse: q.reponse.join('\n\n') })),
  mots: t.mots.map((m) => ({ libelle: m.libelle, texte: m.texte })),
})));

/* Menus de navigation.json, dans chaque langue : onglets à sous-menu (groupes), onglets directs, liens légaux */
function exporterMenus() {
  const navigation = lireJSON(path.join(SOURCES, 'navigation.json'));
  const lien = (l, langue) => {
    const [cible, ancre = ''] = l.lien.split('#');
    return { titre: l[langue], lien: jeton(cible, langue, 'navigation.json'), ancre, accent: !!l.mise_en_avant };
  };
  return Object.fromEntries(LANGUES.map((langue) => [langue, {
    principal: [
      ...navigation.groupes.map((g) => ({ type: 'groupe', id: g.id, titre: g.libelle[langue], pied: g.pied[langue], directs_au_pied: !!g.directs_au_pied, liens: g.liens.map((l) => lien(l, langue)) })),
      ...navigation.directs.map((l) => ({ type: 'direct', ...lien(l, langue) })),
    ],
    legal: navigation.legal.map((l) => lien(l, langue)),
  }]));
}

const copies = construireTheme();
const contenus = {
  genere: new Date().toISOString(),
  langues: LANGUES,
  pages: exporterPages(),
  ...exporterArticles(),
  diapositives: exporterDiapositives(),
  stations: exporterStations(),
  galeries: exporterGaleries(),
  talents: exporterTalents(),
  menus: exporterMenus(),
};
contenus.medias = [...medias].map(([fichier, alt]) => ({ fichier, alt }));
fs.mkdirSync(IMPORT, { recursive: true });
fs.writeFileSync(path.join(IMPORT, 'contenus.json'), JSON.stringify(contenus, null, 1));
console.log(`Thème : ${THEME} (${copies} fichier(s) copié(s))`);
console.log(`Contenus : ${contenus.pages.length} pages, ${contenus.articles.length} articles, ${contenus.diapositives.length} diapositives, ${contenus.stations.length} stations, ${contenus.galeries.length} galeries, ${contenus.talents.length} portraits, ${contenus.medias.length} médias`);
