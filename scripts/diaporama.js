/**
 * Diaporama d'ouverture de l'accueil : modèle d'affichage des diapositives décrites dans sources/diaporama-accueil.json.
 * Préfigure le bloc WordPress « Diaporama d'accueil » : une liste répétable de diapositives (fond vidéo ou photo,
 * sur-titre, titre, chapô, boutons), rendue par le serveur puis animée par app.js.
 *
 *  remplir()     fonds empilés, voile, commandes (pause, repères), légendes : remplace <!-- diaporama:accueil -->
 *                dans la section .hero de l'accueil (la section et le lien « Défiler » restent dans la page)
 *  precharger()  préchargement du premier fond (affiche de la vidéo ou photo), placé dans l'en-tête de la page
 *
 * Utilisé par scripts/assembler-pages.js, avec "precharger": "diaporama" dans l'en-tête JSON de la page.
 */
const fs = require('fs');
const path = require('path');

const charger = (sources) => JSON.parse(fs.readFileSync(path.join(sources, 'diaporama-accueil.json'), 'utf8')).diapositives;
const srcset = (f) => `${f.src}-768.jpg 768w, ${f.src}.jpg 1536w`;

/* Fond : ni autoplay ni loading="lazy" sur la vidéo, visible dès l'ouverture : app.js la lance (sauf si la personne
   limite les animations), l'affiche s'affiche en attendant. Les photos suivantes se chargent derrière, en priorité basse. */
function fond(f, i, seule) {
  const actif = i === 0 ? ' est-actif' : '';
  if (f.type === 'video') {
    return `      <video class="hero-fond${actif}" muted playsinline${seule ? ' loop' : ''} preload="metadata" poster="${f.affiche}" width="${f.largeur}" height="${f.hauteur}">
        <source src="${f.src}" type="video/mp4">
      </video>`;
  }
  const priorite = i === 0 ? ' fetchpriority="high"' : ' fetchpriority="low" decoding="async"';
  return `      <img class="hero-fond hero-image${actif}" src="${f.src}.jpg" srcset="${srcset(f)}" sizes="100vw" alt="" width="${f.largeur}" height="${f.hauteur}"${priorite}>`;
}

const bouton = (b) => (b.style === 'principal'
  ? `<a class="bouton" href="${b.lien}">${b.texte} <span class="fleche" aria-hidden="true">→</span></a>`
  : `<a class="bouton bouton-contour-blanc" href="${b.lien}">${b.texte}</a>`);

/* Légende : la première diapositive porte le titre de la page (h1), les suivantes un paragraphe de même style */
function legende(d, i, total) {
  const titre = i === 0 ? `<h1 class="hero-titre" id="hero-titre">${d.titre}</h1>` : `<p class="hero-titre">${d.titre}</p>`;
  return `        <div class="hero-bloc${i === 0 ? ' est-actif' : ''}" id="hero-diapo-${i + 1}" role="group" aria-roledescription="diapositive" aria-label="${i + 1} sur ${total}" data-duree="${d.duree}"${i === 0 ? '' : ' inert'}>
          <p class="sur-titre clair">${d.surTitre}</p>
          ${titre}
          <p class="hero-chapo">${d.chapo}</p>
          <div class="hero-actions">
${d.boutons.map((b) => `            ${bouton(b)}`).join('\n')}
          </div>
        </div>`;
}

/* Commandes placées avant les légendes : le bouton pause est le premier élément atteint au clavier */
function commandes(diapos) {
  const total = diapos.length;
  const reperes = total < 2 ? '' : `
      <div class="hero-reperes">
${diapos.map((d, i) => `        <button class="hero-repere" type="button" aria-controls="hero-diapo-${i + 1}"${i === 0 ? ' aria-current="true"' : ''}><span class="visuellement-masque">Diapositive ${i + 1} sur ${total} : ${d.titre}</span></button>`).join('\n')}
      </div>`;
  return `    <div class="hero-commandes">
      <button class="hero-pause bouton-rond" type="button" aria-pressed="false" aria-label="Mettre le diaporama en pause">
        <svg class="icone icone-pause" aria-hidden="true"><use href="#i-pause"/></svg>
        <svg class="icone icone-lecture" aria-hidden="true"><use href="#i-lecture"/></svg>
      </button>${reperes}
    </div>`;
}

function remplir(contenu, diapos) {
  const seule = diapos.length === 1;
  return contenu.replace(/^[ \t]*<!-- diaporama:accueil -->/m, () => `    <div class="hero-fonds" aria-hidden="true">
${diapos.map((d, i) => fond(d.fond, i, seule)).join('\n')}
    </div>
    <div class="voile" aria-hidden="true"></div>
${commandes(diapos)}
    <div class="conteneur hero-contenu">
      <div class="hero-legendes" aria-live="off">
${diapos.map((d, i) => legende(d, i, diapos.length)).join('\n')}
      </div>
    </div>`);
}

function precharger(diapos) {
  const f = diapos[0].fond;
  return f.type === 'video' ? { src: f.affiche } : { src: `${f.src}.jpg`, srcset: srcset(f) };
}

module.exports = { charger, remplir, precharger };
