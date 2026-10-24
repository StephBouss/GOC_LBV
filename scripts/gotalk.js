/**
 * GO’TALK : portraits métier des talents décrits dans sources/gotalk.json. Chaque talent préfigure un contenu WordPress
 * « Talent » (nom, fonction, service, photo, titre, chapeau, entretien, « En quelques mots ») :
 *
 *  cartes()     une carte par talent : la photo, le nom et la fonction, rien d'autre ; un clic ouvre son portrait
 *  portraits()  une fenêtre <dialog> par talent : photo et identité d'un côté, entretien de l'autre (app.js l'ouvre,
 *               avec une transition de la photo de la carte vers la fenêtre, et donne à chaque portrait son adresse #id)
 *
 * Textes : *italique* et {en|texte dans une autre langue} ; le reste est échappé. Un nom vide (à fournir par le client)
 * laisse la fonction en titre de la carte. Langues : sources/<langue>/gotalk.json traduit les textes d'interface et
 * chaque talent, par identifiant. Utilisé par scripts/assembler-pages.js : repères <!-- gotalk:talents -->,
 * <!-- gotalk:portraits --> (après <!-- apres -->) et {{gotalk:nombre}} dans la source de la page.
 */
const fs = require('fs');
const path = require('path');

const echapper = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const enrichir = (s) => echapper(s).replace(/\{([a-z]{2})\|([^}]*)\}/g, '<span lang="$1">$2</span>').replace(/\*([^*]+)\*/g, '<em>$1</em>');
const TRADUITS = ['fonction', 'service', 'alt', 'titre', 'chapo', 'entretien', 'mots'];

function charger(sources, langue) {
  const lire = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
  const d = lire(path.join(sources, 'gotalk.json'));
  if (langue !== 'fr') {
    const trad = lire(path.join(sources, langue, 'gotalk.json'));
    for (const k of Object.keys(d.textes)) {
      if (!trad.textes || !trad.textes[k]) throw new Error(`${langue}/gotalk.json : pas de traduction pour textes.${k}`);
      d.textes[k] = trad.textes[k];
    }
    d.talents = d.talents.map((t) => {
      const tr = (trad.talents || {})[t.id] || {};
      const manque = TRADUITS.concat(t.nom ? ['nom'] : []).filter((k) => !tr[k]);
      if (manque.length) throw new Error(`${langue}/gotalk.json : ${t.id} sans traduction pour ${manque.join(', ')}`);
      return { ...t, ...tr };
    });
  }
  for (const t of d.talents) t.photo = `img/photos/gotalk-${t.id}`;
  return d;
}

// Titre de la carte et de la fenêtre : le nom, ou la fonction tant que le nom manque
const identite = (t) => (t.nom ? { titre: t.nom, sous: t.fonction } : { titre: t.fonction, sous: t.service });
const image = (t, sizes, alt, attributs = '') => `<img src="${t.photo}.jpg" srcset="${t.photo}-768.jpg 768w, ${t.photo}.jpg 960w" sizes="${sizes}" alt="${echapper(alt)}" width="960" height="1200"${attributs}>`;

const cartes = (d) => `<ul class="talents" data-cascade>
${d.talents.map((t) => `          <li>
            <button class="talent-carte" type="button" data-talent="${t.id}" aria-haspopup="dialog" aria-controls="talent-${t.id}">
              <span class="talent-carte-photo">${image(t, '(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 24rem', '', ' loading="lazy"')}</span>
              <span class="talent-carte-bulle" aria-hidden="true">”</span>
              <span class="talent-carte-texte">
                <span class="talent-carte-nom">${echapper(identite(t).titre)}</span>
                <span class="talent-carte-fonction">${echapper(identite(t).sous)}</span>
                <span class="talent-carte-lire">${echapper(d.textes.lire)} <svg class="icone" aria-hidden="true"><use href="#i-fleche"/></svg></span>
              </span>
            </button>
          </li>`).join('\n')}
        </ul>`;

function portrait(d, t, i) {
  const n = d.talents.length;
  const voisin = (sens, cle) => {
    const v = d.talents[(i + sens + n) % n];
    return `<button class="talent-voisin talent-voisin-${cle}" type="button" data-talent-voisin="${v.id}"><span class="talent-voisin-sens">${echapper(d.textes[cle])}</span><span class="talent-voisin-nom">${echapper(identite(v).titre)}</span></button>`;
  };
  const id = `talent-${t.id}`;
  return `<dialog class="talent" id="${id}" closedby="any" aria-labelledby="${id}-titre">
  <div class="talent-cadre">
    <button class="talent-fermer" type="button" data-ferme aria-label="${echapper(d.textes.fermer)}"><svg class="icone" aria-hidden="true"><use href="#i-fermer"/></svg></button>
    <figure class="talent-portrait">
      ${image(t, '(max-width: 1023px) 100vw, 26rem', t.alt, ' loading="lazy"')}
      <figcaption class="talent-identite">
        <span class="talent-identite-nom">${echapper(identite(t).titre)}</span>
        ${t.nom ? `<span class="talent-identite-fonction">${echapper(t.fonction)}</span>\n        ` : ''}<span class="talent-identite-service">${echapper(t.service)}</span>
      </figcaption>
    </figure>
    <div class="talent-lecture">
      <div class="talent-progression" aria-hidden="true"></div>
      <article class="talent-article">
        <header class="talent-tete">
          <p class="talent-rubrique"><span class="talent-marque">GO’TALK</span> ${echapper(d.textes.rubrique)}</p>
          <h2 class="talent-titre" id="${id}-titre">${enrichir(t.titre)}</h2>
          <p class="talent-chapo">${enrichir(t.chapo)}</p>
        </header>
${t.entretien.map((q) => `        <section class="talent-echange">
          <h3>${enrichir(q.question)}</h3>
${q.accroche ? `          <p class="talent-accroche">${enrichir(q.accroche)}</p>\n` : ''}${q.reponse.map((p) => `          <p>${enrichir(p)}</p>`).join('\n')}
        </section>`).join('\n')}
        <section class="talent-mots" aria-labelledby="${id}-mots">
          <h3 id="${id}-mots">${echapper(d.textes.mots)}</h3>
          <dl>
${t.mots.map((m) => `            <div><dt>${enrichir(m.libelle)}</dt><dd>${enrichir(m.texte)}</dd></div>`).join('\n')}
          </dl>
        </section>
      </article>
${n > 1 ? `      <nav class="talent-suite" aria-label="${echapper(d.textes.autres)}">\n        ${voisin(-1, 'precedent')}\n        ${voisin(1, 'suivant')}\n      </nav>\n` : ''}    </div>
  </div>
</dialog>`;
}

const portraits = (d) => d.talents.map((t, i) => portrait(d, t, i)).join('\n');

function remplir(contenu, d) {
  if (!contenu.includes('gotalk:')) return contenu;
  return contenu
    .replace(/^[ \t]*<!-- gotalk:talents -->/m, (m) => m.replace('<!-- gotalk:talents -->', cartes(d)))
    .replace(/^<!-- gotalk:portraits -->/m, () => portraits(d))
    .replace(/\{\{gotalk:nombre\}\}/g, String(d.talents.length));
}

module.exports = { charger, remplir };
