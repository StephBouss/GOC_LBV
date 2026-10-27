/**
 * Diaporama d'ouverture de l'accueil : modèle d'affichage des diapositives décrites dans sources/diaporama-accueil.json.
 * Préfigure le bloc WordPress « Diaporama d'accueil » : une liste répétable de diapositives (fond vidéo ou photo,
 * sur-titre, titre, chapô, boutons), rendue par le serveur puis animée par app.js.
 *
 *  remplir()     fonds empilés, voile, commandes (pause, repères), légendes : remplace <!-- diaporama:accueil -->
 *                dans la section .hero de l'accueil (la section et le lien « Défiler » restent dans la page)
 *  precharger()  préchargement du premier fond (affiche de la vidéo ou photo), placé dans l'en-tête de la page
 *
 * Langues : le fichier français décrit tout (fonds, durées, liens) ; sources/<langue>/diaporama-accueil.json ne donne que
 * les textes de chaque diapositive (repérée par son « id »). Une traduction manquante arrête la génération.
 *
 * Utilisé par scripts/assembler-pages.js, avec "precharger": "diaporama" dans l'en-tête JSON de la page.
 */
const fs = require('fs');
const path = require('path');

const lire = (fichier) => JSON.parse(fs.readFileSync(fichier, 'utf8'));
const remplacerRepere = (modele, valeurs) => modele.replace(/\{(\w+)\}/g, (tout, cle) => valeurs[cle]);

/* Diapositives dans une langue : textes de sources/<langue>/diaporama-accueil.json sur les diapositives françaises */
function charger(sources, langue, t) {
  const diapositives = lire(path.join(sources, 'diaporama-accueil.json')).diapositives;
  if (langue !== 'fr') {
    const trad = lire(path.join(sources, langue, 'diaporama-accueil.json')).diapositives;
    const manque = (quoi) => { throw new Error(`${langue}/diaporama-accueil.json : pas de traduction pour ${quoi}`); };
    diapositives.forEach((d) => {
      const x = trad[d.id] || manque(`la diapositive « ${d.id} »`);
      for (const champ of ['surTitre', 'titre', 'chapo']) d[champ] = x[champ] || manque(`« ${d.id} ».${champ}`);
      if ((x.boutons || []).length !== d.boutons.length) manque(`les boutons de « ${d.id} »`);
      d.boutons.forEach((b, i) => { b.texte = x.boutons[i]; });
    });
  }
  return { diapositives, t };
}
const srcset = (f) => `${f.src}-768.jpg 768w, ${f.src}.jpg 1536w`;

/* Fond : ni autoplay ni loading="lazy" sur la vidéo, visible dès l'ouverture. preload="none" : rien n'est téléchargé
   avant qu'app.js ne la lance, ce qu'il ne fait ni en mode économie de données, ni si la personne limite les animations,
   ni sur téléphone pour une vidéo sans version verticale ; l'affiche reste alors à sa place. WebM d'abord (plus léger),
   MP4 pour les autres navigateurs. Version verticale (« mobile ») : les sources larges sont réservées aux écrans d'au
   moins 768 px ; un navigateur qui ignore media prend la version large partout.
   Les photos suivantes se chargent derrière, en priorité basse. */
const sources = (v, media = '') => [
  v.webm && `<source src="${v.webm}" type="video/webm; codecs=vp9"${media}>`,
  `<source src="${v.src}" type="video/mp4"${media}>`,
].filter(Boolean);
function fond(f, i, seule) {
  const actif = i === 0 ? ' est-actif' : '';
  if (f.type === 'video') {
    const liste = f.mobile ? [...sources(f, ' media="(min-width: 768px)"'), ...sources(f.mobile)] : sources(f);
    return `      <video class="hero-fond${actif}" muted playsinline${seule ? ' loop' : ''} preload="none" poster="${f.affiche}" width="${f.largeur}" height="${f.hauteur}">
${liste.map((s) => `        ${s}`).join('\n')}
      </video>`;
  }
  const priorite = i === 0 ? ' fetchpriority="high"' : ' fetchpriority="low" decoding="async"';
  return `      <img class="hero-fond hero-image${actif}" src="${f.src}.jpg" srcset="${srcset(f)}" sizes="100vw" alt="" width="${f.largeur}" height="${f.hauteur}"${priorite}>`;
}

const bouton = (b) => (b.style === 'principal'
  ? `<a class="bouton" href="${b.lien}">${b.texte} <span class="fleche" aria-hidden="true">→</span></a>`
  : `<a class="bouton bouton-contour-blanc" href="${b.lien}">${b.texte}</a>`);

/* Légende : la première diapositive porte le titre de la page (h1), les suivantes un paragraphe de même style */
function legende(d, i, total, t) {
  const titre = i === 0 ? `<h1 class="hero-titre" id="hero-titre">${d.titre}</h1>` : `<p class="hero-titre">${d.titre}</p>`;
  return `        <div class="hero-bloc${i === 0 ? ' est-actif' : ''}" id="hero-diapo-${i + 1}" role="group" aria-roledescription="${t.diapositive}" aria-label="${remplacerRepere(t['diapositive-rang'], { n: i + 1, total })}" data-duree="${d.duree}"${i === 0 ? '' : ' inert'}>
          <p class="sur-titre clair">${d.surTitre}</p>
          ${titre}
          <p class="hero-chapo">${d.chapo}</p>
          <div class="hero-actions">
${d.boutons.map((b) => `            ${bouton(b)}`).join('\n')}
          </div>
        </div>`;
}

/* Commandes placées avant les légendes : le bouton pause est le premier élément atteint au clavier */
function commandes(diapos, t) {
  const total = diapos.length;
  const reperes = total < 2 ? '' : `
      <div class="hero-reperes">
${diapos.map((d, i) => `        <button class="hero-repere" type="button" aria-controls="hero-diapo-${i + 1}"${i === 0 ? ' aria-current="true"' : ''}><span class="visuellement-masque">${remplacerRepere(t['diapositive-repere'], { n: i + 1, total, titre: d.titre })}</span></button>`).join('\n')}
      </div>`;
  return `    <div class="hero-commandes">
      <button class="hero-pause bouton-rond" type="button" aria-pressed="false" aria-label="${t['diaporama-pause']}">
        <svg class="icone icone-pause" aria-hidden="true"><use href="#i-pause"/></svg>
        <svg class="icone icone-lecture" aria-hidden="true"><use href="#i-lecture"/></svg>
      </button>${reperes}
    </div>`;
}

function remplir(contenu, { diapositives: diapos, t }) {
  const seule = diapos.length === 1;
  return contenu.replace(/^[ \t]*<!-- diaporama:accueil -->/m, () => `    <div class="hero-fonds" aria-hidden="true">
${diapos.map((d, i) => fond(d.fond, i, seule)).join('\n')}
    </div>
    <div class="voile" aria-hidden="true"></div>
${commandes(diapos, t)}
    <div class="conteneur hero-contenu">
      <div class="hero-legendes" aria-live="off">
${diapos.map((d, i) => legende(d, i, diapos.length, t)).join('\n')}
      </div>
    </div>`);
}

function precharger({ diapositives }) {
  const f = diapositives[0].fond;
  return f.type === 'video' ? { src: f.affiche } : { src: `${f.src}.jpg`, srcset: srcset(f) };
}

module.exports = { charger, remplir, precharger };
