/**
 * Actualités : modèles d'affichage des articles décrits dans sources/actualites.json.
 * Chaque fonction préfigure un élément du futur thème WordPress :
 *
 *  carte()        « Modèle de publication » d'une boucle de requête : image à la une, catégorie, date, titre, extrait
 *  accueil()      boucle de requête de l'accueil : les 3 articles les plus récents
 *  liste()        modèle home.html (page des articles) : 20 articles au plus, du plus récent au plus ancien
 *  filtres()      catégories non vides : liens vers les archives de catégorie, filtrés sur place par app.js
 *  pageArticle()  modèle single.html : en-tête, image à la une, contenu, « À lire aussi » (même catégorie d'abord)
 *
 * Langues : le fichier français décrit tout (date, catégorie, images) ; sources/<langue>/actualites.json ne donne que
 * ce qui se traduit (adresse, titre, extrait, contenu, textes alternatifs, noms des catégories), comme une traduction
 * liée dans Polylang. Une traduction manquante arrête la génération. Les textes de l'interface viennent de libelles.json.
 *
 * Utilisé par scripts/assembler-pages.js : repères <!-- actualites:accueil -->, <!-- actualites:filtres -->,
 * <!-- actualites:liste --> dans les sources des pages, et une page actualites/<slug>.html par article (dans chaque langue).
 */
const fs = require('fs');
const path = require('path');

const MAX_LISTE = 20;
const MAX_ACCUEIL = 3;

const remplacerRepere = (modele, valeurs) => modele.replace(/\{(\w+)\}/g, (tout, cle) => valeurs[cle]);
/* Le jour de publication n'est pas toujours connu : la date s'affiche au mois, comme sur le site de référence. */
const dateAffichee = (iso, t) => { const [annee, mois] = iso.split('-'); return `${t.mois[Number(mois) - 1]} ${annee}`; };
const dateMachine = (iso) => iso.slice(0, 7);
const texteBrut = (html) => html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&');
const minutesDeLecture = (a) => Math.max(1, Math.round(a.contenu.map(texteBrut).join(' ').split(/\s+/).length / 200));
/* Adresse d'un article, toujours écrite avec son slug français : l'assembleur la remplace par celle de sa traduction */
const lienArticle = (a) => `actualites/${a.slug}.html`;
const fichierImage = (img) => (img.src.endsWith('.svg') ? img.src : `${img.src}.jpg`);

/* Traduction d'un article ou d'une catégorie : textes de sources/<langue>/actualites.json sur les données françaises */
function traduire(donnees, sources, langue) {
  const trad = JSON.parse(fs.readFileSync(path.join(sources, langue, 'actualites.json'), 'utf8'));
  const manque = (quoi) => { throw new Error(`${langue}/actualites.json : pas de traduction pour ${quoi}`); };
  const categories = donnees.categories.map((c) => ({ ...c, nom: trad.categories[c.slug] || manque(`la catégorie « ${c.slug} »`) }));
  const articles = donnees.articles.map((a) => {
    const t = trad.articles[a.slug] || manque(`l'article « ${a.slug} »`);
    for (const champ of ['slug', 'titre', 'extrait', 'contenu']) if (!t[champ]) manque(`« ${a.slug} ».${champ}`);
    if (a.image.alt && !(t.image && t.image.alt)) manque(`le texte alternatif de l'image de « ${a.slug} »`);
    const galerie = a.galerie || [];
    if (galerie.length !== (t.galerie || []).length) manque(`la galerie de « ${a.slug} » (${galerie.length} photo(s))`);
    return {
      ...a,
      slugTraduit: t.slug,
      titre: t.titre,
      extrait: t.extrait,
      contenu: t.contenu,
      image: { ...a.image, alt: t.image && t.image.alt },
      galerie: galerie.map((g, i) => ({ ...g, alt: t.galerie[i].alt })),
    };
  });
  return { categories, articles };
}

function charger(sources, langue, t) {
  let donnees = JSON.parse(fs.readFileSync(path.join(sources, 'actualites.json'), 'utf8'));
  if (langue !== 'fr') donnees = traduire(donnees, sources, langue);
  const noms = Object.fromEntries(donnees.categories.map((c) => [c.slug, c.nom]));
  for (const a of donnees.articles) {
    if (!noms[a.categorie]) throw new Error(`actualites.json : catégorie inconnue « ${a.categorie} » (${a.slug})`);
  }
  // Ordre de publication : du plus récent au plus ancien, quel que soit l'ordre du fichier
  const articles = [...donnees.articles].sort((x, y) => y.date.localeCompare(x.date));
  return { categories: donnees.categories, noms, articles, t };
}

/* Image à la une : variantes 768 px et pleine taille (photos), fichier unique (illustrations vectorielles) */
function image(img, { sizes, alt = '', prioritaire = false }) {
  const srcset = img.src.endsWith('.svg') ? '' : ` srcset="${img.src}-768.jpg 768w, ${img.src}.jpg ${img.largeur}w" sizes="${sizes}"`;
  const chargement = prioritaire ? ' fetchpriority="high"' : ' loading="lazy"';
  const cadrage = img.position ? ` style="object-position: ${img.position}"` : '';
  return `<img src="${fichierImage(img)}"${srcset} alt="${alt}" width="${img.largeur}" height="${img.hauteur}"${chargement}${cadrage}>`;
}

function carte(a, d, { sizes, retrait = '        ' }) {
  const r = retrait;
  return `${r}<article class="carte-actu" data-categorie="${a.categorie}">
${r}  <div class="carte-actu-photo">${image(a.image, { sizes, alt: a.image.alt })}</div>
${r}  <div class="carte-actu-corps">
${r}    <p class="carte-actu-meta"><span class="categorie">${d.noms[a.categorie]}</span><time datetime="${dateMachine(a.date)}">${dateAffichee(a.date, d.t)}</time></p>
${r}    <h3><a href="${lienArticle(a)}">${a.titre}</a></h3>
${r}    <p class="extrait">${a.extrait}</p>
${r}    <span class="lire" aria-hidden="true">${d.t['lire-la-suite']} <svg><use href="#i-fleche"/></svg></span>
${r}  </div>
${r}</article>`;
}

const TAILLES_ACCUEIL = '(max-width: 767px) 85vw, (max-width: 1023px) 44vw, 28vw';
const TAILLES_LISTE = '(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 28vw';

const accueil = (d) => d.articles.slice(0, MAX_ACCUEIL).map((a) => carte(a, d, { sizes: TAILLES_ACCUEIL })).join('\n');
const liste = (d) => d.articles.slice(0, MAX_LISTE).map((a) => carte(a, d, { sizes: TAILLES_LISTE })).join('\n');

function filtres(d) {
  const affiches = d.articles.slice(0, MAX_LISTE);
  const nombre = (slug) => affiches.filter((a) => a.categorie === slug).length;
  const compte = (n) => `<span class="filtre-nombre">${n}<span class="visuellement-masque"> ${n > 1 ? d.t.articles : d.t.article}</span></span>`;
  const items = [
    `<li><a href="actualites/index.html" data-filtre="" aria-current="true">${d.t['toutes-categories']} ${compte(affiches.length)}</a></li>`,
    ...d.categories.filter((c) => nombre(c.slug)).map((c) =>
      `<li><a href="actualites/index.html?categorie=${c.slug}" data-filtre="${c.slug}" data-nom="${c.nom}">${c.nom} ${compte(nombre(c.slug))}</a></li>`),
  ];
  return items.map((i) => `          ${i}`).join('\n');
}

/* Remplace les repères des sources de pages par les articles */
function remplacer(contenu, d) {
  return contenu
    .replace(/^[ \t]*<!-- actualites:accueil -->/m, () => accueil(d))
    .replace(/^[ \t]*<!-- actualites:liste -->/m, () => liste(d))
    .replace(/^[ \t]*<!-- actualites:filtres -->/m, () => filtres(d))
    .replace(/\{\{actualites:nombre\}\}/g, () => String(Math.min(d.articles.length, MAX_LISTE)));
}

function pageArticle(a, d) {
  const { t } = d;
  const categorie = d.noms[a.categorie];
  const memeCategorie = d.articles.filter((x) => x.slug !== a.slug && x.categorie === a.categorie);
  const autres = d.articles.filter((x) => x.slug !== a.slug && x.categorie !== a.categorie);
  const aLire = [...memeCategorie, ...autres].slice(0, 3);
  // Galerie : après le deuxième paragraphe (ou à la fin pour un article court)
  const blocs = a.contenu.map((p) => `      <p>${p}</p>`);
  const galerie = (a.galerie || []).map((g) => `      <figure class="article-figure${g.hauteur > g.largeur ? ' portrait' : ''}">${image(g, { sizes: '(max-width: 767px) 100vw, 46rem', alt: g.alt || '' })}</figure>`);
  blocs.splice(Math.min(2, blocs.length), 0, ...galerie);
  const img = a.image;
  return {
    fichier: lienArticle(a),
    meta: {
      titre: remplacerRepere(t['titre-article'], { titre: texteBrut(a.titre) }),
      description: texteBrut(a.extrait),
      onglet: 'information',
      article: true,   // og:type article
      precharger: img.src.endsWith('.svg') ? { src: img.src } : { src: `${img.src}.jpg`, srcset: `${img.src}-768.jpg 768w, ${img.src}.jpg ${img.largeur}w`, sizes: '(max-width: 767px) 100vw, 54rem' },
      css: ['css/pages.css'],
    },
    contenu: `
  <!-- Navigation de la rubrique -->
  <nav class="sous-nav" aria-label="${t['rubrique-information']}">
    <ul>
      <li><a href="actualites/index.html" aria-current="true">${t.actualites}</a></li>
      <li><a href="mediatheque/index.html">${t.mediatheque}</a></li>
      <li><a href="contact/index.html#candidature">${t.carrieres}</a></li>
      <li><a href="contact/index.html">${t.contact}</a></li>
    </ul>
  </nav>

  <!-- ═══════════ Article (modèle single.html) ═══════════ -->
  <article class="article" aria-labelledby="article-titre">
    <header class="conteneur article-tete">
      <nav class="fil-ariane" aria-label="${t['fil-ariane']}">
        <ol>
          <li><a href="index.html">${t.accueil}</a></li>
          <li><a href="actualites/index.html">${t.actualites}</a></li>
          <li><a href="actualites/index.html?categorie=${a.categorie}">${categorie}</a></li>
        </ol>
      </nav>
      <p class="sur-titre">${categorie}</p>
      <h1 class="article-titre" id="article-titre">${a.titre}</h1>
      <p class="article-chapo">${a.extrait}</p>
      <p class="article-meta"><time datetime="${dateMachine(a.date)}">${dateAffichee(a.date, t)}</time><span aria-hidden="true">·</span>${remplacerRepere(t['minutes-lecture'], { n: minutesDeLecture(a) })}</p>
    </header>
    <figure class="conteneur article-image${img.src.endsWith('.svg') ? ' illustration' : ''}">${image(img, { sizes: '(max-width: 767px) 100vw, 54rem', alt: img.alt, prioritaire: true })}</figure>
    <div class="conteneur article-corps">
${blocs.join('\n')}
      <p class="article-retour"><a class="lien-fleche" href="actualites/index.html">${t['toutes-actualites']} <svg aria-hidden="true"><use href="#i-fleche"/></svg></a></p>
    </div>
  </article>

  <!-- ═══════════ À lire aussi (même catégorie d'abord, puis les plus récents) ═══════════ -->
  <section class="section fond-surface" aria-labelledby="autres-titre">
    <div class="conteneur">
      <div class="tete-section" data-apparition>
        <div>
          <p class="sur-titre">${t['a-lire-aussi']}</p>
          <h2 class="titre-section" id="autres-titre">${t['autres-actualites']}</h2>
        </div>
        <a class="lien-fleche" href="actualites/index.html">${t['toutes-actualites']} <svg aria-hidden="true"><use href="#i-fleche"/></svg></a>
      </div>
      <div class="liste-actus" data-cascade>
${aLire.map((x) => carte(x, d, { sizes: TAILLES_LISTE })).join('\n')}
      </div>
    </div>
  </section>
`,
  };
}

module.exports = { charger, remplacer, pageArticle, lienArticle };
