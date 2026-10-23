/**
 * Référencement et partage : adresse publique des pages, balises canonical, Open Graph et X, plan du site (sitemap.xml)
 * et robots.txt. Dans WordPress, une extension SEO (Yoast, Rank Math…) prendra le relais.
 *
 *  balises()   en-tête de chaque page : canonical, versions dans les autres langues (hreflang), og:*, twitter:card
 *              (repère {{partage}} du gabarit)
 *  plan()      sitemap.xml : une adresse par page, le français puis l'anglais, chaque accueil en tête
 *  robots()    robots.txt : exploration ouverte, adresse du plan du site
 *  source()    image d'origine de l'aperçu d'une page et son point focal ; cible() le fichier de 1200 × 630 px qui en est tiré
 *
 * Utilisé par scripts/assembler-pages.js et scripts/preparer-partage.js (qui produit les images de img/partage/).
 */
const path = require('path');

/* Adresse publique du site, sans « / » final. À changer au passage sur le nom de domaine définitif, puis régénérer les pages. */
const ADRESSE_SITE = 'https://snhg-vert.vercel.app';
/* Nom du site dans chaque langue (règle du client, 23/10/2026) : SNHG en français, GOC (nom commercial) en anglais */
const NOM_SITE = { fr: 'SNHG – Gabon Oil Company', en: 'Gabon Oil Company' };
/* Langue de chaque version (Open Graph) ; le français est la langue par défaut (x-default) */
const LOCALES = { fr: 'fr_FR', en: 'en_GB' };
const DOSSIER = 'img/partage';
const LARGEUR = 1200;
const HAUTEUR = 630;
/* Aperçu des pages sans photo propre (accueil, articles illustrés d'une vignette SVG) : deux opérateurs sur une installation */
const IMAGE_DEFAUT = { src: 'img/photos/accueil-expertise.jpg', position: '50% 60%' };

const attribut = (texte) => texte.replace(/&(?!#?\w+;)/g, '&amp;').replace(/"/g, '&quot;');

/* Adresse publique d'une page : son dossier pour un index.html (« /activites/ »), le fichier sinon */
const adresse = (fichier) => `${ADRESSE_SITE}/${fichier.replace(/(^|\/)index\.html$/, '$1')}`;

/* Image d'origine : "partage" de l'en-tête JSON ({ src, position }), sinon la photo d'ouverture préchargée, recadrée au même
   point focal que sur la page (style="object-position: …" de sa balise <img>). Les vignettes SVG n'en donnent pas. */
function source(meta, contenu = '') {
  if (meta.partage) return meta.partage;
  const src = meta.precharger && meta.precharger.src;
  if (!src || !src.endsWith('.jpg')) return null;
  const balise = contenu.match(new RegExp(`<img[^>]*\\ssrc="${src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`));
  const position = balise && balise[0].match(/object-position:\s*([^;"]+)/);
  return { src, position: position ? position[1].trim() : '50% 50%' };
}

const cible = (src) => `${DOSSIER}/${path.posix.basename(src)}`;

/* Titre de l'aperçu : le titre de l'onglet sans le nom du site, que og:site_name porte déjà */
const titrePartage = (titre) => titre.replace(/ · ((Actualités|News) · )?(SNHG – )?Gabon Oil Company$/, '');

/* versions : fichier de la page dans chaque langue ({ fr: 'groupe/presentation.html', en: 'en/group/about.html' }) */
function balises(fichier, meta, image, langue, versions) {
  const url = adresse(fichier);
  return [
    `<link rel="canonical" href="${url}">`,
    ...Object.entries(versions).map(([l, f]) => `<link rel="alternate" hreflang="${l}" href="${adresse(f)}">`),
    `<link rel="alternate" hreflang="x-default" href="${adresse(versions.fr)}">`,
    `<meta property="og:type" content="${meta.article ? 'article' : 'website'}">`,
    `<meta property="og:site_name" content="${NOM_SITE[langue]}">`,
    `<meta property="og:locale" content="${LOCALES[langue]}">`,
    ...Object.keys(versions).filter((l) => l !== langue).map((l) => `<meta property="og:locale:alternate" content="${LOCALES[l]}">`),
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:title" content="${attribut(titrePartage(meta.titre))}">`,
    `<meta property="og:description" content="${attribut(meta.description)}">`,
    `<meta property="og:image" content="${ADRESSE_SITE}/${image}">`,
    `<meta property="og:image:width" content="${LARGEUR}">`,
    `<meta property="og:image:height" content="${HAUTEUR}">`,
    '<meta name="twitter:card" content="summary_large_image">',
  ].map((b) => `  ${b}\n`).join('');
}

function plan(fichiers) {
  const rang = (f) => `${f.startsWith('en/') ? 1 : 0}${/^(en\/)?index\.html$/.test(f) ? 0 : 1}${f}`;
  const ordre = [...fichiers].sort((a, b) => rang(a).localeCompare(rang(b)));
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${ordre.map((f) => `  <url><loc>${adresse(f)}</loc></url>`).join('\n')}
</urlset>
`;
}

const robots = () => `# Exploration ouverte à tous les robots ; le plan du site liste les pages publiées.
User-agent: *
Allow: /

Sitemap: ${ADRESSE_SITE}/sitemap.xml
`;

module.exports = { ADRESSE_SITE, DOSSIER, LARGEUR, HAUTEUR, IMAGE_DEFAUT, adresse, source, cible, balises, plan, robots };
