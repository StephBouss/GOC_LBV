/* Gabon Oil Company — maquette d'accueil.
   Le script ne fait que basculer des classes et des attributs ARIA : tout le rendu est en CSS. */
(() => {
  const reduit = matchMedia('(prefers-reduced-motion: reduce)');
  const navComplete = matchMedia('(min-width: 1141px)');
  // Messages écrits par ce script : dans la langue de la page (<html lang>). Dans WordPress : chaînes traduisibles du thème.
  const anglais = document.documentElement.lang === 'en';
  const t = (fr, en) => (anglais ? en : fr);

  /* ─── Sous-menus : ouverts au survol de l'onglet, refermés quand la souris s'en va ─── */
  const items = [...document.querySelectorAll('.nav-item')];
  let minuterieOuverture = 0;
  let minuterieFermeture = 0;
  let dernierPointeur = 'mouse';

  const basculer = (item, ouvrir) => {
    item.classList.toggle('est-ouvert', ouvrir);
    item.querySelector('.nav-onglet').setAttribute('aria-expanded', String(ouvrir));
  };
  const fermerTout = (sauf) => items.forEach((it) => { if (it !== sauf) basculer(it, false); });
  const ouvert = () => items.find((it) => it.classList.contains('est-ouvert'));

  document.addEventListener('pointerdown', (e) => {
    dernierPointeur = e.pointerType;
    if (!e.target.closest('.nav-principale')) fermerTout();
  });

  items.forEach((item) => {
    const onglet = item.querySelector('.nav-onglet');

    item.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      clearTimeout(minuterieFermeture);
      clearTimeout(minuterieOuverture);
      // Petite intention de survol pour ne pas ouvrir en traversant la barre ;
      // passage immédiat d'un onglet à l'autre quand un sous-menu est déjà ouvert.
      minuterieOuverture = setTimeout(() => { fermerTout(item); basculer(item, true); }, ouvert() ? 0 : 90);
    });

    item.addEventListener('pointerleave', (e) => {
      if (e.pointerType !== 'mouse') return;
      clearTimeout(minuterieOuverture);
      minuterieFermeture = setTimeout(() => basculer(item, false), 180);
    });

    // Clavier et écrans tactiles : le clic bascule. À la souris, l'onglet est déjà ouvert par le survol.
    onglet.addEventListener('click', (e) => {
      const estOuvert = item.classList.contains('est-ouvert');
      if (e.detail > 0 && dernierPointeur === 'mouse') { fermerTout(item); basculer(item, true); return; }
      fermerTout(item);
      basculer(item, !estOuvert);
    });

    item.addEventListener('focusout', (e) => {
      if (!item.contains(e.relatedTarget)) basculer(item, false);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const item = ouvert();
    if (item) { basculer(item, false); item.querySelector('.nav-onglet').focus(); }
  });

  /* ─── Menu tablette / smartphone ─── */
  const menu = document.getElementById('menu-mobile');
  const boutonMenu = document.querySelector('.bouton-menu');
  const fermerMenuBtn = menu.querySelector('.fermer-menu');

  const ouvrirMenu = () => {
    menu.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('est-ouvert')));
    boutonMenu.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-ouvert');
    fermerMenuBtn.focus();
  };
  const fermerMenu = (rendreFocus = true) => {
    menu.classList.remove('est-ouvert');
    boutonMenu.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-ouvert');
    const masquer = () => { if (!menu.classList.contains('est-ouvert')) menu.hidden = true; };
    // transitionend ne vient pas si l'animation est coupée : délai de secours
    if (reduit.matches) masquer(); else { menu.addEventListener('transitionend', masquer, { once: true }); setTimeout(masquer, 400); }
    if (rendreFocus) boutonMenu.focus();
  };

  boutonMenu.addEventListener('click', ouvrirMenu);
  fermerMenuBtn.addEventListener('click', () => fermerMenu());
  menu.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { fermerMenu(); return; }
    if (e.key !== 'Tab') return;
    const focusables = [...menu.querySelectorAll('a, button, summary')].filter((el) => el.offsetParent !== null);
    const premier = focusables[0];
    const dernier = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === premier) { e.preventDefault(); dernier.focus(); }
    else if (!e.shiftKey && document.activeElement === dernier) { e.preventDefault(); premier.focus(); }
  });
  navComplete.addEventListener('change', (e) => {
    if (e.matches && !menu.hidden) fermerMenu(false);
    if (!e.matches) fermerTout();
  });

  /* ─── Choix de la langue : la traduction s'ouvre au même endroit (catégorie filtrée ?categorie=…, partie visée #…),
         les identifiants étant les mêmes dans les deux langues ─── */
  document.querySelectorAll('.langues a[hreflang]:not([aria-current])').forEach((a) => {
    const suivre = () => {
      const cible = new URL(a.href);
      cible.search = location.search;
      cible.hash = location.hash;
      a.href = cible.href;
    };
    ['click', 'auxclick', 'contextmenu'].forEach((type) => a.addEventListener(type, suivre));
  });

  /* ─── Ouverture de page : entrée du texte (accueil et pages intérieures), pause du zoom lent (accueil) ─── */
  const hero = document.querySelector('.hero, .page-hero');
  if (hero) requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('est-pret')));

  const pause = (bouton, cible, libelles) => {
    if (!bouton || !cible) return;
    bouton.addEventListener('click', () => {
      const enPause = bouton.getAttribute('aria-pressed') !== 'true';
      bouton.setAttribute('aria-pressed', String(enPause));
      bouton.setAttribute('aria-label', enPause ? libelles[1] : libelles[0]);
      cible.classList.toggle('est-en-pause', enPause);
    });
  };
  if (hero && !hero.matches('[data-diaporama]')) pause(hero.querySelector('.hero-pause'), hero, [t("Mettre l'animation en pause", 'Pause the animation'), t("Relancer l'animation", 'Resume the animation')]);

  /* ─── Diaporama de l'accueil : la vidéo joue jusqu'au bout, chaque photo reste data-duree secondes ;
         à chaque fond sa légende et ses boutons. Les diapositives sont générées depuis sources/diaporama-accueil.json. ─── */
  const diaporama = document.querySelector('.hero[data-diaporama]');
  if (diaporama) {
    const fonds = [...diaporama.querySelectorAll('.hero-fond')];
    const blocs = [...diaporama.querySelectorAll('.hero-bloc')];
    const reperes = [...diaporama.querySelectorAll('.hero-repere')];
    const legendes = diaporama.querySelector('.hero-legendes');
    const boutonPause = diaporama.querySelector('.hero-pause');
    let index = 0;
    let enPause = false;       // demandé par la personne (bouton, focus clavier, « réduire les animations »)
    let survol = false;        // pointeur sur la légende : on ne change pas les boutons sous la souris
    let horsEcran = false;
    let ecoule = 0;            // temps passé sur une photo, en ms
    let dernier = 0;
    let boucle = 0;
    let minuterieSortie = 0;

    const video = (i) => (fonds[i].tagName === 'VIDEO' && !('bloquee' in fonds[i].dataset) ? fonds[i] : null);
    const enMouvement = () => !enPause && !horsEcran && !document.hidden;
    // Vidéo : sa propre position de lecture ; photo (ou vidéo bloquée) : le temps écoulé sur sa durée
    const progression = () => {
      const v = video(index);
      if (v) return v.ended ? 1 : v.currentTime / (v.duration || Infinity);
      return ecoule / (Number(blocs[index].dataset.duree || 8) * 1000);
    };
    const tic = (t) => {
      if (!video(index) && !survol) ecoule += Math.min(t - (dernier || t), 100);
      dernier = t;
      const p = Math.min(1, progression());
      reperes[index]?.style.setProperty('--progression', p);
      if (p >= 1 && !survol && blocs.length > 1) aller(index + 1);
      boucle = requestAnimationFrame(tic);
    };
    const lire = (v) => v.play().catch((e) => {
      // lecture automatique refusée (mode économie d'énergie…) : l'affiche reste, la diapositive dure data-duree
      if (e.name === 'NotAllowedError') v.dataset.bloquee = '';
    });
    const synchroniser = () => {
      const v = video(index);
      const bouge = enMouvement();
      if (v) { if (bouge && v.paused && !v.ended) lire(v); else if (!bouge) v.pause(); }
      if (bouge && !boucle) { dernier = 0; boucle = requestAnimationFrame(tic); }
      if (!bouge) { cancelAnimationFrame(boucle); boucle = 0; }
      diaporama.classList.toggle('est-en-pause', !bouge);
      legendes.setAttribute('aria-live', enPause ? 'polite' : 'off');   // annonce des changements seulement à l'arrêt
    };

    const aller = (cible) => {
      const suivant = (cible + blocs.length) % blocs.length;
      if (suivant === index) return;
      const precedent = index;
      index = suivant;
      ecoule = 0;
      diaporama.style.setProperty('--attente', '.35s');   // la nouvelle légende entre après la sortie de l'ancienne
      [fonds, blocs].forEach((liste) => {
        liste[suivant].classList.remove('est-sortant');
        liste[suivant].classList.add('est-actif');
        liste[precedent].classList.replace('est-actif', 'est-sortant');
      });
      blocs.forEach((b, i) => { b.inert = i !== suivant; });
      reperes.forEach((r, i) => {
        if (i === suivant) r.setAttribute('aria-current', 'true'); else r.removeAttribute('aria-current');
        if (i !== suivant) r.style.setProperty('--progression', 0);
      });
      const v = video(suivant);
      if (v) { v.currentTime = 0; if (!enMouvement()) v.pause(); }
      // la vidéo de la diapositive d'après se charge pendant celle-ci : elle démarrera sans attente
      const prochaine = video((suivant + 1) % blocs.length);
      if (prochaine && enMouvement()) prochaine.preload = 'auto';
      clearTimeout(minuterieSortie);
      minuterieSortie = setTimeout(() => {   // fin du fondu : l'ancien fond et l'ancienne légende disparaissent
        diaporama.querySelectorAll('.est-sortant').forEach((el) => el.classList.remove('est-sortant'));
        fonds.forEach((f, i) => { if (i !== index && f.tagName === 'VIDEO') f.pause(); });
      }, 1200);
      synchroniser();
    };

    const basculer = (pause) => {
      enPause = pause;
      boutonPause.setAttribute('aria-pressed', String(pause));
      boutonPause.setAttribute('aria-label', pause ? t('Relancer le diaporama', 'Resume the slideshow') : t('Mettre le diaporama en pause', 'Pause the slideshow'));
      synchroniser();
    };
    boutonPause.addEventListener('click', () => basculer(!enPause));
    reperes.forEach((r, i) => r.addEventListener('click', () => {
      reperes[index].style.setProperty('--progression', 0);
      if (i === index) { ecoule = 0; const v = video(i); if (v) v.currentTime = 0; } else aller(i);
    }));

    // Arrêt automatique : focus clavier dans le hero (il ne reprend qu'avec le bouton), pointeur sur la légende
    diaporama.addEventListener('focusin', (e) => { if (!enPause && e.target.matches(':focus-visible')) basculer(true); });
    legendes.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') survol = true; });
    legendes.addEventListener('pointerleave', () => { survol = false; });

    // Hors de l'écran ou onglet masqué : vidéo et minuterie s'arrêtent, sans toucher au choix de la personne
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { horsEcran = !e.isIntersecting; synchroniser(); }).observe(diaporama);
    }
    document.addEventListener('visibilitychange', synchroniser);

    // Mode économie de données, ou téléphone pour une vidéo sans version verticale (sources larges sans media) :
    // la vidéo n'est pas chargée, l'affiche reste et la diapositive dure data-duree
    const economie = Boolean(navigator.connection?.saveData);
    const telephone = matchMedia('(max-width: 767px)').matches;
    fonds.forEach((f) => {
      if (f.tagName !== 'VIDEO') return;
      if (economie || (telephone && !f.querySelector('source[media]'))) { f.dataset.bloquee = ''; return; }
      const echec = () => { f.dataset.bloquee = ''; };   // fichier introuvable ou illisible : la diapositive passe en minuterie
      f.addEventListener('error', echec);
      // erreur sur la dernière source seulement : avant elle, le navigateur essaie la suivante (MP4 après WebM)
      f.querySelector('source:last-of-type')?.addEventListener('error', echec);
    });

    // « Réduire les animations » : rien ne bouge par défaut, le bouton permet de lancer le diaporama
    reduit.addEventListener('change', (e) => { if (e.matches) basculer(true); });
    basculer(reduit.matches);
  }

  /* ─── Bandeau des filiales (accueil) ─── */
  pause(document.querySelector('.bouton-pause'), document.querySelector('.bandeau'), [t('Mettre le défilement en pause', 'Pause the scrolling'), t('Relancer le défilement', 'Resume the scrolling')]);

  /* ─── Compteurs des chiffres clés ─── */
  const formater = (n) => (n < 10000 ? String(n) : String(n).replace(/\B(?=(\d{3})+(?!\d))/g, t(' ', ',')));
  const compter = (el) => {
    const fin = Number(el.dataset.compteur);
    const debut = fin > 1900 && fin < 2100 ? fin - 30 : 0;   // une année défile depuis 30 ans plus tôt
    const t0 = performance.now();
    const pas = (t) => {
      const p = Math.min(1, (t - t0) / 1500);
      el.textContent = formater(Math.round(debut + (fin - debut) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(pas);
    };
    requestAnimationFrame(pas);
  };

  /* ─── Apparitions au défilement (fondus, cascades, photos en rideau, traits qui se dessinent) ─── */
  const animes = document.querySelectorAll('[data-apparition], [data-cascade], [data-devoile], [data-trace]');
  // Rang de chaque élément dans sa liste : sert de délai aux cascades (grilles, sous-menus, menu mobile)
  document.querySelectorAll('[data-cascade], .sous-menu-liens, .accordeon ul, .menu-mobile-nav')
    .forEach((c) => [...c.children].forEach((el, i) => el.style.setProperty('--rang', i)));

  if (reduit.matches || !('IntersectionObserver' in window)) {
    animes.forEach((el) => el.classList.add('est-visible'));
  } else {
    const io = new IntersectionObserver((entrees) => entrees.forEach((entree) => {
      if (!entree.isIntersecting) return;
      entree.target.classList.add('est-visible');
      entree.target.querySelectorAll('[data-compteur]').forEach(compter);
      io.unobserve(entree.target);
    }), { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    animes.forEach((el) => io.observe(el));
  }

  /* ─── Frise des dates clés : chaque date apparaît quand le trait rouge l'atteint (aux 4/5 de l'écran) ─── */
  const etapes = document.querySelectorAll('.frise .etape');
  if (reduit.matches || !('IntersectionObserver' in window)) {
    etapes.forEach((el) => el.classList.add('est-visible'));
  } else {
    const ioEtapes = new IntersectionObserver((entrees) => entrees.forEach((entree) => {
      if (!entree.isIntersecting) return;
      entree.target.classList.add('est-visible');
      ioEtapes.unobserve(entree.target);
    }), { rootMargin: '0px 0px -20% 0px' });
    etapes.forEach((el) => ioEtapes.observe(el));
  }

  /* ─── En-tête : ombre portée dès que la page défile ─── */
  const entete = document.querySelector('.entete');
  let majPrevue = false;
  const majEntete = () => { entete.classList.toggle('est-defile', window.scrollY > 4); majPrevue = false; };
  window.addEventListener('scroll', () => {
    if (!majPrevue) { majPrevue = true; requestAnimationFrame(majEntete); }
  }, { passive: true });
  majEntete();

  /* ─── Bouton « haut de page » : rien tant que l'ouverture de page (ou, sans ouverture, le premier écran) est visible.
     Dans la marge des grands écrans, il reste ensuite affiché ; ailleurs, il passerait sur le texte :
     il n'apparaît qu'en remontant la page, ou tout en bas, et s'efface dès qu'on redescend ─── */
  const hautDePage = document.querySelector('.haut-de-page');
  const dansLaMarge = matchMedia('(min-width: 87.5rem)');
  let ouverturePassee = false, remonte = false, dernierY = window.scrollY, majHautPrevue = false;
  const majHautDePage = () => {
    const y = window.scrollY;
    if (Math.abs(y - dernierY) > 12) { remonte = y < dernierY; dernierY = y; }
    if (!hero) ouverturePassee = y > innerHeight * .8;
    const enBas = y + innerHeight >= document.documentElement.scrollHeight - 48;
    hautDePage.classList.toggle('est-visible', ouverturePassee && (dansLaMarge.matches || remonte || enBas));
    majHautPrevue = false;
  };
  window.addEventListener('scroll', () => {
    if (!majHautPrevue) { majHautPrevue = true; requestAnimationFrame(majHautDePage); }
  }, { passive: true });
  dansLaMarge.addEventListener('change', majHautDePage);
  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { ouverturePassee = !e.isIntersecting; majHautDePage(); }).observe(hero);
  }
  majHautDePage();
  hautDePage.addEventListener('click', () => {
    window.scrollTo({ top: 0 });   // défilement doux via scroll-behavior (sauf « réduire les animations »)
    document.querySelector('.entete-logo').focus({ preventScroll: true });
  });

  /* ─── Pied de page : colonnes ouvertes dès la tablette, en accordéon sur smartphone ─── */
  const piedLarge = matchMedia('(min-width: 768px)');
  const colonnes = document.querySelectorAll('.pied-colonne');
  // En grand écran les intitulés de colonnes sont de simples titres : ni repliables, ni atteignables au clavier.
  const appliquer = () => colonnes.forEach((d) => {
    d.open = piedLarge.matches;
    d.querySelector('summary').tabIndex = piedLarge.matches ? -1 : 0;
  });
  appliquer();
  piedLarge.addEventListener('change', appliquer);
  colonnes.forEach((d) => d.querySelector('summary').addEventListener('click', (e) => {
    if (piedLarge.matches) e.preventDefault();
  }));

  /* ─── Formulaire de souscription (rubrique Carrières) : pièces jointes. La zone de dépôt affiche le nom des fichiers
         choisis, ou la règle non respectée (format, nombre, taille), qui bloque aussi l'envoi. Le serveur d'envoi doit
         refaire ces contrôles. ─── */
  const fichiers = document.querySelector('.depot input');
  const nomFichiers = document.querySelector('.depot-nom');
  if (fichiers && nomFichiers) {
    fichiers.addEventListener('change', () => {
      const liste = [...fichiers.files];
      const { maxFichiers, maxMo } = fichiers.dataset;
      let erreur = '';
      if (liste.length > Number(maxFichiers)) erreur = t(`${maxFichiers} fichiers au maximum.`, `${maxFichiers} files at most.`);
      else if (liste.some((x) => !/\.(pdf|docx)$/i.test(x.name))) erreur = t('Formats acceptés : PDF ou DOCX.', 'Accepted formats: PDF or DOCX.');
      else if (liste.some((x) => x.size > Number(maxMo) * 1024 * 1024)) erreur = t(`Chaque fichier doit peser ${maxMo} Mo au maximum.`, `Each file must be ${maxMo} MB or smaller.`);
      fichiers.setCustomValidity(erreur);
      nomFichiers.textContent = erreur || liste.map((x) => x.name).join(', ');
      nomFichiers.classList.toggle('est-erreur', Boolean(erreur));
    });
    fichiers.form.addEventListener('reset', () => { fichiers.setCustomValidity(''); nomFichiers.textContent = ''; nomFichiers.classList.remove('est-erreur'); });
  }

  /* ─── Accordéons exclusifs (raisons de la page Carrières, menu mobile) : l'attribut name des <details> n'en laisse
         qu'un ouvert ; là où il n'est pas pris en charge, ouvrir un élément referme les autres du même groupe ─── */
  if (!('name' in HTMLDetailsElement.prototype)) {
    document.querySelectorAll('details[name]').forEach((d) => d.addEventListener('toggle', () => {
      if (d.open) document.querySelectorAll(`details[name="${d.getAttribute('name')}"]`).forEach((autre) => { if (autre !== d) autre.open = false; });
    }));
  }

  /* ─── GO’TALK : la carte d'un talent ouvre son portrait (<dialog>). La photo glisse de la carte à la fenêtre, et d'un
         portrait au suivant (transition de vue, là où elle existe, sans « mouvement réduit »). Chaque portrait a son
         adresse #identifiant, qui l'ouvre à l'arrivée. ─── */
  const portraits = [...document.querySelectorAll('dialog.talent')];
  if (portraits.length) {
    const portraitDe = (id) => document.getElementById(`talent-${id}`);
    const photoDe = (d) => d.querySelector('.talent-portrait img');
    const ouvert = () => portraits.find((d) => d.open);
    // La photo de départ, puis celle d'arrivée, portent le nom de la transition ; le reste de la page reste en place
    const transition = (depart, arrivee, changer) => {
      if (!document.startViewTransition || reduit.matches || !depart || !arrivee) { changer(); return; }
      const racine = document.documentElement;
      racine.classList.add('vt-portrait');
      depart.style.viewTransitionName = 'talent-photo';
      const vt = document.startViewTransition(() => { depart.style.viewTransitionName = ''; changer(); arrivee.style.viewTransitionName = 'talent-photo'; });
      vt.finished.finally(() => { arrivee.style.viewTransitionName = ''; racine.classList.remove('vt-portrait'); });
    };
    const ouvrir = (id, depart) => {
      const d = portraitDe(id);
      if (!d || d.open) return;
      const courant = ouvert();
      transition(depart, photoDe(d), () => {
        if (courant) courant.close();
        d.showModal();
        d.scrollTop = 0;
        d.querySelector('.talent-lecture').scrollTop = 0;
      });
      history.replaceState(null, '', `#${id}`);
    };
    const fermer = (d) => transition(photoDe(d), document.querySelector(`.talent-carte[aria-controls="${d.id}"] img`), () => d.close());

    document.querySelectorAll('.talent-carte').forEach((c) => c.addEventListener('click', () => ouvrir(c.dataset.talent, c.querySelector('img'))));
    portraits.forEach((d) => {
      d.querySelectorAll('[data-ferme]').forEach((b) => b.addEventListener('click', () => fermer(d)));
      d.querySelectorAll('[data-talent-voisin]').forEach((b) => b.addEventListener('click', () => ouvrir(b.dataset.talentVoisin, photoDe(d))));
      // Fermeture au clic sur le fond : native avec closedby="any", à reproduire là où l'attribut n'est pas pris en charge
      if (!('closedBy' in HTMLDialogElement.prototype)) d.addEventListener('click', (e) => { if (e.target === d) fermer(d); });
      d.addEventListener('close', () => {
        if (!ouvert() && location.hash === `#${d.id.replace(/^talent-/, '')}`) history.replaceState(null, '', location.pathname + location.search);
      });
    });
    const parAdresse = () => { const id = decodeURIComponent(location.hash.slice(1)); if (id && portraitDe(id)) ouvrir(id, null); };
    parAdresse();
    window.addEventListener('hashchange', parAdresse);
  }

  /* ─── Liseuse de documents (rapport de la page Activités) : <dialog> modal, pages du PDF dessinées par PDF.js,
         ce qui permet la lecture sur place sur tous les appareils (Android n'affiche pas les PDF dans une page).
         PDF.js (js/pdfjs/) n'est chargé qu'à la première ouverture ; sans script, le lien ouvre le PDF dans un nouvel onglet. ─── */
  // PDF.js est rangé à côté de ce script : son adresse se déduit de celle du script, quel que soit le dossier de la page
  // (src*= et non src$= : l'adresse du script porte sa version, « js/app.js?ver=… »)
  const scriptApp = document.currentScript || document.querySelector('script[src*="js/app.js"]');
  const dossierScripts = new URL('.', scriptApp ? scriptApp.src : location.href);
  document.querySelectorAll('dialog.liseuse').forEach((liseuse) => {
    const zone = liseuse.querySelector('.liseuse-pages');
    const statut = liseuse.querySelector('.liseuse-statut');
    const adresse = new URL(liseuse.dataset.pdf, location.href).href;
    let chargement = null;

    // Page dessinée à la largeur affichée (écrans haute densité compris), puis son texte pour les lecteurs d'écran
    const dessiner = async (doc, figure) => {
      const page = await doc.getPage(Number(figure.dataset.page));
      const largeur = figure.clientWidth * Math.min(window.devicePixelRatio || 1, 2);
      const vue = page.getViewport({ scale: largeur / page.getViewport({ scale: 1 }).width });
      const canvas = figure.querySelector('canvas');
      canvas.width = Math.floor(vue.width);
      canvas.height = Math.floor(vue.height);
      await page.render({ canvasContext: canvas.getContext('2d'), viewport: vue }).promise;
      figure.classList.add('est-dessinee');
      const texte = await page.getTextContent();
      figure.querySelector('.liseuse-texte').textContent = texte.items.map((t) => t.str + (t.hasEOL ? '\n' : '')).join('');
    };

    const preparer = async () => {
      const pdfjs = await import(new URL('pdfjs/pdf.min.js', dossierScripts).href);
      pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs/pdf.worker.min.js', dossierScripts).href;
      // isEvalSupported: false : PDF.js n'essaie pas de compiler du code (new Function), interdit par la politique de contenu
      const doc = await pdfjs.getDocument({ url: adresse, isEvalSupported: false }).promise;
      // Toutes les pages sont posées à leurs proportions, puis dessinées à l'approche de l'écran
      const figures = [];
      for (let n = 1; n <= doc.numPages; n++) {
        const { width, height } = (await doc.getPage(n)).getViewport({ scale: 1 });
        const figure = document.createElement('figure');
        figure.className = 'liseuse-page';
        figure.dataset.page = n;
        figure.innerHTML = `<div class="liseuse-feuille" style="aspect-ratio: ${width} / ${height}"><canvas aria-hidden="true"></canvas></div>`
          + `<figcaption class="liseuse-numero">${t(`Page ${n} sur ${doc.numPages}`, `Page ${n} of ${doc.numPages}`)}</figcaption><div class="visuellement-masque liseuse-texte"></div>`;
        figures.push(figure);
      }
      statut.hidden = true;
      zone.append(...figures);
      const io = new IntersectionObserver((entrees) => entrees.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        dessiner(doc, e.target).catch(() => {});
      }), { root: zone, rootMargin: '100% 0px' });
      figures.forEach((f) => io.observe(f));
    };

    const ouvrir = () => {
      if (!liseuse.open) liseuse.showModal();
      chargement ??= preparer().catch(() => {
        chargement = null;   // nouvel essai à la prochaine ouverture
        statut.hidden = false;
        statut.innerHTML = t(
          `Le document ne peut pas s'afficher ici. <a href="${adresse}" target="_blank">Ouvrir le PDF dans un nouvel onglet</a> ou utilisez le bouton Télécharger.`,
          `The document cannot be displayed here. <a href="${adresse}" target="_blank">Open the PDF in a new tab</a> or use the Download button.`);
      });
    };
    document.querySelectorAll(`[data-liseuse="${liseuse.id}"]`).forEach((l) => l.addEventListener('click', (e) => { e.preventDefault(); ouvrir(); }));
    liseuse.querySelectorAll('[data-ferme]').forEach((b) => b.addEventListener('click', () => liseuse.close()));
    // Fermeture au clic sur le fond : native avec closedby="any", à reproduire là où l'attribut n'est pas pris en charge (Safari)
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      liseuse.addEventListener('click', (e) => {
        if (e.target !== liseuse) return;
        const r = liseuse.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) liseuse.close();
      });
    }
  });

  /* ─── Médiathèque : visionneuse plein écran (<dialog> modal), photo par photo dans la galerie choisie.
         Sans script, chaque vignette ouvre simplement la grande image. ─── */
  const visionneuse = document.getElementById('visionneuse');
  if (visionneuse) {
    const cadre = visionneuse.querySelector('.visionneuse-cadre');
    const legende = visionneuse.querySelector('.visionneuse-legende');
    const nomGalerie = visionneuse.querySelector('.visionneuse-galerie');
    const compteur = visionneuse.querySelector('.visionneuse-compteur');
    const image = document.createElement('img');
    image.className = 'visionneuse-image';
    image.decoding = 'async';
    image.draggable = false;
    cadre.append(image);
    image.addEventListener('load', () => image.classList.remove('est-chargement'));
    let serie = [];
    let rang = 0;

    const afficher = (i) => {
      rang = (i + serie.length) % serie.length;
      const lien = serie[rang];
      const vignette = lien.querySelector('img');
      image.classList.add('est-chargement');
      image.width = Number(lien.dataset.largeur);
      image.height = Number(lien.dataset.hauteur);
      image.src = lien.href;
      image.alt = vignette.alt;
      legende.textContent = vignette.alt;
      compteur.textContent = `${rang + 1} / ${serie.length}`;
      // Photos voisines chargées d'avance, en priorité basse : le passage à la suivante est immédiat
      [rang + 1, rang - 1].forEach((j) => {
        const voisine = new Image();
        voisine.fetchPriority = 'low';
        voisine.src = serie[(j + serie.length) % serie.length].href;
      });
    };

    document.querySelectorAll('[data-visionneuse]').forEach((lien) => {
      lien.setAttribute('aria-haspopup', 'dialog');
      lien.addEventListener('click', (e) => {
        e.preventDefault();
        serie = [...document.querySelectorAll(`[data-visionneuse="${lien.dataset.visionneuse}"]`)];
        nomGalerie.textContent = document.getElementById(`galerie-${lien.dataset.visionneuse}`)?.textContent || '';
        afficher(serie.indexOf(lien));
        visionneuse.showModal();
      });
    });
    visionneuse.querySelector('.visionneuse-precedente').addEventListener('click', () => afficher(rang - 1));
    visionneuse.querySelector('.visionneuse-suivante').addEventListener('click', () => afficher(rang + 1));
    visionneuse.querySelector('[data-ferme]').addEventListener('click', () => visionneuse.close());
    visionneuse.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); afficher(rang + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); afficher(rang - 1); }
    });
    // Balayage horizontal au doigt ; le clic qui le termine n'est pas pris pour une fermeture
    let depart = null;
    let balaye = false;
    visionneuse.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') depart = e.clientX; });
    visionneuse.addEventListener('pointerup', (e) => {
      if (depart === null) return;
      const ecart = e.clientX - depart;
      depart = null;
      if (Math.abs(ecart) > 50) { balaye = true; afficher(rang + (ecart < 0 ? 1 : -1)); }
    });
    // Clic sur le fond sombre, à côté de la photo : fermeture (la fenêtre couvre tout l'écran, sans fond cliquable)
    visionneuse.addEventListener('click', (e) => {
      if (balaye) { balaye = false; return; }
      if (e.target === visionneuse || e.target === cadre || e.target.classList.contains('visionneuse-figure')) visionneuse.close();
    });
    // À la fermeture, le focus revient sur la vignette de la dernière photo regardée
    visionneuse.addEventListener('close', () => serie[rang]?.focus());
  }

  /* ─── Sous-navigation de rubrique (défilante sur smartphone) : l'élément actif est amené dans la bande ─── */
  const sousNav = document.querySelector('.sous-nav ul');
  const actif = sousNav && sousNav.querySelector('[aria-current]');
  if (actif && sousNav.scrollWidth > sousNav.clientWidth) {
    const ecart = actif.getBoundingClientRect().left - sousNav.getBoundingClientRect().left;
    sousNav.scrollLeft += ecart - (sousNav.clientWidth - actif.offsetWidth) / 2;
  }

  /* ─── Sommaire des pages légales : la partie en cours de lecture est signalée ─── */
  const sommaire = document.querySelector('.legal-sommaire ol');
  if (sommaire) {
    const liens = [...sommaire.querySelectorAll('a')];
    const signaler = (actif) => liens.forEach((a) => {
      if (a === actif) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    if (CSS.supports('scroll-target-group: auto')) {
      // Le surlignage est natif (:target-current) ; l'état est recopié pour les lecteurs d'écran une fois le défilement arrêté
      const synchroniser = () => signaler(sommaire.querySelector('a:target-current'));
      synchroniser();
      document.addEventListener('scrollend', synchroniser);
    } else if ('IntersectionObserver' in window) {
      // Firefox, Safari : la partie qui franchit une ligne au tiers haut de l'écran devient la partie courante
      // (au milieu, une partie courte atteinte par le sommaire laisserait la main à la suivante)
      const io = new IntersectionObserver((entrees) => entrees.forEach((e) => {
        if (!e.isIntersecting) return;
        const actif = liens.find((a) => a.hash === `#${e.target.id}`);
        liens.forEach((a) => a.classList.toggle(':target-current', a === actif));
        signaler(actif);
      }), { rootMargin: '-30% 0px -70% 0px', threshold: 0 });
      liens.forEach((a) => { const cible = document.getElementById(a.hash.slice(1)); if (cible) io.observe(cible); });
    }
  }

  /* ─── Actualités : filtre par catégorie ───
     Les pastilles sont des liens vers la catégorie (archives de catégorie dans WordPress) ; ici le filtrage se fait sur place,
     l'adresse garde la catégorie (?categorie=…) pour être partagée ou rouverte. */
  const filtres = document.querySelector('.filtres');
  const grille = document.querySelector('.liste-actus');
  if (filtres && grille) {
    const pastilles = [...filtres.querySelectorAll('a[data-filtre]')];
    const cartes = [...grille.querySelectorAll('.carte-actu')];
    const statut = document.querySelector('.filtres-statut');
    const centrer = (a) => {
      const bande = a.closest('ul');
      if (bande.scrollWidth > bande.clientWidth) bande.scrollLeft += a.getBoundingClientRect().left - bande.getBoundingClientRect().left - (bande.clientWidth - a.offsetWidth) / 2;
    };
    const appliquer = (filtre) => {
      let n = 0;
      cartes.forEach((c) => { c.hidden = Boolean(filtre) && c.dataset.categorie !== filtre; if (!c.hidden) n += 1; });
      const active = pastilles.find((a) => a.dataset.filtre === filtre);
      pastilles.forEach((a) => a.setAttribute('aria-current', String(a === active)));
      const nombre = t(`${n} actualité${n > 1 ? 's' : ''}`, `${n} article${n === 1 ? '' : 's'}`);
      if (statut) statut.textContent = `${nombre}${filtre ? ` · ${active.dataset.nom}` : ''}`;
      centrer(active);
    };
    // Les cartes glissent vers leur nouvelle place : transition de vue limitée à la grille, le reste de la page reste utilisable.
    // Navigateurs sans transition de vue d'élément : mise à jour immédiate.
    const avecTransition = (maj) => {
      if (reduit.matches || !('startViewTransition' in Element.prototype)) { maj(); return; }
      grille.startViewTransition(maj).ready.catch(() => {});
    };
    filtres.addEventListener('click', (e) => {
      const a = e.target.closest('a[data-filtre]');
      if (!a) return;
      e.preventDefault();
      if (a.getAttribute('aria-current') === 'true') return;
      avecTransition(() => appliquer(a.dataset.filtre));
      const adresse = new URL(location.href);
      if (a.dataset.filtre) adresse.searchParams.set('categorie', a.dataset.filtre); else adresse.searchParams.delete('categorie');
      history.replaceState(null, '', adresse);
    });
    const demandee = new URLSearchParams(location.search).get('categorie');
    if (demandee && pastilles.some((a) => a.dataset.filtre === demandee)) appliquer(demandee);
  }

  /* ─── Stations Gab'Oil : survoler ou choisir une station de la liste fait briller son point sur la carte, et inversement ;
     la station choisie reste allumée jusqu'au choix suivant (ou Échap). Les pastilles filtrent la liste et la carte par état.
     La liste est l'interface accessible : les points de la carte la doublent pour la souris et le toucher. ─── */
  const carte = document.querySelector('.carte-gabon');
  const listeStations = document.querySelector('.stations-liste');
  if (carte && listeStations) {
    const figure = carte.closest('.stations-carte');
    const bulle = figure.querySelector('.carte-bulle');
    const { width: largeur, height: hauteur } = carte.viewBox.baseVal;
    const points = new Map([...carte.querySelectorAll('.point')].map((p) => [p.dataset.station, p]));
    const boutons = new Map([...listeStations.querySelectorAll('button.station')].map((b) => [b.dataset.station, b]));
    let survolee = null;
    let choisie = null;

    const montrer = (id) => {
      points.forEach((p, k) => p.classList.toggle('est-active', k === id));
      boutons.forEach((b, k) => b.classList.toggle('est-active', k === id));
      carte.classList.toggle('a-un-point-actif', Boolean(id));
      if (!id) { bulle.hidden = true; return; }
      const point = points.get(id);
      point.parentNode.append(point);   // dessiné par-dessus les autres
      const { e: x, f: y } = point.transform.baseVal.consolidate().matrix;
      const bouton = boutons.get(id);
      const nom = document.createElement('strong');
      const ligne = document.createElement('span');
      nom.textContent = bouton.querySelector('.station-nom').textContent;
      ligne.textContent = [bouton.querySelector('.station-lieu')?.textContent, bouton.closest('.stations-groupe').dataset.libelle].filter(Boolean).join(' · ');
      bulle.querySelector('.carte-bulle-texte').replaceChildren(nom, ligne);
      // Photo de la station, ou le logo Gab'Oil quand elle n'en a pas encore
      const photos = [...bulle.querySelectorAll('.carte-bulle-photo img')];
      const photo = photos.find((i) => i.dataset.station === id) || photos.find((i) => !i.dataset.station);
      photos.forEach((i) => { i.hidden = i !== photo; });
      bulle.style.setProperty('--x', `${(x / largeur) * 100}%`);
      bulle.style.setProperty('--y', `${(y / hauteur) * 100}%`);
      bulle.dataset.cote = x / largeur < .18 ? 'gauche' : x / largeur > .82 ? 'droite' : '';
      bulle.hidden = false;
      // Sous le point quand la bulle (avec sa photo) dépasserait du haut de la carte
      bulle.classList.toggle('en-dessous', (y / hauteur) * carte.getBoundingClientRect().height < bulle.offsetHeight + 24);
    };
    const actualiser = () => montrer(survolee || choisie);
    const choisir = (id) => {
      choisie = choisie === id ? null : id;
      boutons.forEach((b, k) => b.setAttribute('aria-pressed', String(k === choisie)));
      actualiser();
    };
    // Carte au-dessus de la liste (tablette, smartphone) : elle revient en vue quand on choisit une station
    const ramenerCarte = () => {
      if (getComputedStyle(figure).position === 'sticky') return;
      const r = figure.getBoundingClientRect();
      if (r.top < 80 || r.bottom > innerHeight) figure.scrollIntoView({ block: 'center', behavior: reduit.matches ? 'auto' : 'smooth' });
    };

    listeStations.addEventListener('pointerover', (e) => {
      const b = e.target.closest('button.station');
      if (b && e.pointerType !== 'touch') { survolee = b.dataset.station; actualiser(); }
    });
    listeStations.addEventListener('pointerout', (e) => {
      const b = e.target.closest('button.station');
      if (b && !b.contains(e.relatedTarget)) { survolee = null; actualiser(); }
    });
    listeStations.addEventListener('focusin', (e) => { const b = e.target.closest('button.station'); if (b) { survolee = b.dataset.station; actualiser(); } });
    listeStations.addEventListener('focusout', () => { survolee = null; actualiser(); });
    listeStations.addEventListener('click', (e) => {
      const b = e.target.closest('button.station');
      if (!b) return;
      choisir(b.dataset.station);
      if (choisie) ramenerCarte();
    });

    carte.addEventListener('pointerover', (e) => {
      const p = e.target.closest('.point');
      if (p && e.pointerType !== 'touch') { survolee = p.dataset.station; actualiser(); }
    });
    carte.addEventListener('pointerout', (e) => {
      const p = e.target.closest('.point');
      if (p && !p.contains(e.relatedTarget)) { survolee = null; actualiser(); }
    });
    carte.addEventListener('click', (e) => {
      const p = e.target.closest('.point');
      if (!p) return;
      choisir(p.dataset.station);
      const b = boutons.get(p.dataset.station);
      const r = b.getBoundingClientRect();
      if (choisie && (r.top < 80 || r.bottom > innerHeight)) b.scrollIntoView({ block: 'nearest', behavior: reduit.matches ? 'auto' : 'smooth' });
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && choisie) choisir(choisie); });

    // Filtre par état : groupes de la liste et points de la carte
    const pastillesEtat = [...document.querySelectorAll('.stations-filtres button[data-filtre]')];
    document.querySelector('.stations-filtres')?.addEventListener('click', (e) => {
      const bouton = e.target.closest('button[data-filtre]');
      if (!bouton) return;
      const etat = bouton.dataset.filtre;
      pastillesEtat.forEach((p) => p.setAttribute('aria-pressed', String(p === bouton)));
      listeStations.querySelectorAll('.stations-groupe').forEach((g) => { g.hidden = Boolean(etat) && g.dataset.etat !== etat; });
      points.forEach((p) => p.classList.toggle('est-masque', Boolean(etat) && p.dataset.etat !== etat));
      if (choisie && points.get(choisie).classList.contains('est-masque')) choisir(choisie);
    });
  }

  /* ─── Cartes Google Maps (page Contact) : contenu tiers, chargé seulement avec l'accord du visiteur. L'accord est retenu
     dans le navigateur (stockage local, aucun cookie du site) et se retire dans la page Gestion des cookies. ─── */
  const ACCORD_CARTES = 'snhg-cartes-google';
  const accordCartes = {
    lire: () => { try { return localStorage.getItem(ACCORD_CARTES) === 'oui'; } catch { return false; } },
    ecrire: (oui) => { try { if (oui) localStorage.setItem(ACCORD_CARTES, 'oui'); else localStorage.removeItem(ACCORD_CARTES); } catch { /* stockage indisponible : l'accord vaut pour la page */ } },
  };

  /* ─── Implantations (page Contact) : choisir une entité centre la carte Google Maps sur sa fiche ; sans accord, le lien
     « Ouvrir dans Google Maps » suit l'entité choisie et le premier « Afficher la carte » charge la carte. ─── */
  const zoneCarte = document.querySelector('[data-carte-google]');
  if (zoneCarte) {
    const figure = zoneCarte.closest('.implantations-carte');
    const lieux = [...document.querySelectorAll('.implantation')];
    const choisieTexte = figure.querySelector('.implantations-choisie');
    const lienMaps = figure.querySelector('.implantations-ouvrir');
    let choisi = lieux.find((b) => b.getAttribute('aria-pressed') === 'true') || lieux[0];
    let cadre = null;
    const nomDe = (b) => `${b.querySelector('.station-nom').textContent} · ${b.querySelector('.station-lieu').textContent}`;
    const montrer = () => {
      if (!cadre) {
        cadre = document.createElement('iframe');
        cadre.className = 'implantations-google';
        cadre.referrerPolicy = 'no-referrer-when-downgrade';
        zoneCarte.replaceChildren(cadre);
      }
      cadre.title = `Google Maps : ${nomDe(choisi)}`;
      cadre.src = `https://www.google.com/maps?q=${encodeURIComponent(choisi.dataset.lieu)}&ll=${choisi.dataset.coord}&z=16&hl=${anglais ? 'en' : 'fr'}&output=embed`;
    };
    const choisir = (b) => {
      choisi = b;
      lieux.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      choisieTexte.textContent = nomDe(b);
      lienMaps.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.dataset.lieu)}`;
      if (cadre) montrer();
    };
    document.querySelector('.implantations-liste').addEventListener('click', (e) => {
      const b = e.target.closest('.implantation');
      if (!b) return;
      choisir(b);
      // Carte au-dessus de la liste (tablette, smartphone) : elle revient en vue
      if (getComputedStyle(figure).position === 'sticky') return;
      const r = figure.getBoundingClientRect();
      if (r.top < 80 || r.bottom > innerHeight) figure.scrollIntoView({ block: 'center', behavior: reduit.matches ? 'auto' : 'smooth' });
    });
    zoneCarte.querySelector('[data-carte-accord]').addEventListener('click', () => { accordCartes.ecrire(true); montrer(); });
    if (accordCartes.lire()) montrer();
  }

  /* ─── Cadastre pétrolier : le poster de la DGAPG est montré tel quel. Une carte d'étiquettes au même cadrage (un gris par
     entrée de la légende, identifiant × 10) dit à quelle entrée appartient chaque point, lignes de la légende du poster
     comprises. Survoler ou choisir une entrée de la liste, ou une zone du poster, voile le reste et cerne la zone de rouge ;
     l'entrée choisie le reste jusqu'au choix suivant (ou Échap). La liste est l'interface accessible. ─── */
  const calque = document.querySelector('.cadastre-calque');
  if (calque) {
    const figure = calque.closest('.cadastre-carte');
    const cadre = calque.parentElement;
    const etat = figure.querySelector('.cadastre-etat');
    const repos = [...etat.childNodes];
    const boutons = new Map([...document.querySelectorAll('.cadastre-cle')].map((b) => [Number(b.dataset.zone), b]));
    const { width: L, height: H } = calque;
    const ctx = calque.getContext('2d');
    const tampon = document.createElement('canvas');
    const tctx = tampon.getContext('2d');
    let etiquettes = null;          // entrée de chaque point du calque (0 : aucune), une fois la carte d'étiquettes lue
    const emprises = new Map();     // entrée → [x0, y0, x1, y1]
    let survolee = 0;
    let choisie = 0;
    let dessinee = 0;

    // Voile sur tout le poster, zone découpée dedans, liseré rouge de 3 px à cheval sur son bord
    const dessiner = (id) => {
      const [ex0, ey0, ex1, ey1] = emprises.get(id);
      const x0 = Math.max(0, ex0 - 2), y0 = Math.max(0, ey0 - 2), x1 = Math.min(L - 1, ex1 + 2), y1 = Math.min(H - 1, ey1 + 2);
      const l = x1 - x0 + 1, h = y1 - y0 + 1;
      const dans = (x, y) => x >= 0 && y >= 0 && x < L && y < H && etiquettes[y * L + x] === id;
      const bord = new Uint8Array(l * h);
      const trou = new ImageData(l, h);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const d = dans(x, y), k = (y - y0) * l + x - x0;
        if (d) trou.data[k * 4 + 3] = 255;
        if (d !== dans(x + 1, y) || d !== dans(x, y + 1)) bord[k] = 1;
      }
      const trait = new ImageData(l, h);
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < l - 1; x++) {
        const k = y * l + x;
        if (!(bord[k] || bord[k - 1] || bord[k + 1] || bord[k - l] || bord[k + l])) continue;
        trait.data[k * 4] = 237;
        trait.data[k * 4 + 1] = 28;
        trait.data[k * 4 + 2] = 36;
        trait.data[k * 4 + 3] = 255;
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, L, H);
      ctx.fillStyle = 'rgba(20, 23, 27, .62)';
      ctx.fillRect(0, 0, L, H);
      tampon.width = l;
      tampon.height = h;
      tctx.putImageData(trou, 0, 0);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.drawImage(tampon, x0, y0);
      tctx.putImageData(trait, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(tampon, x0, y0);
      dessinee = id;
    };
    // Sous le poster : pastille, nom, groupe et surface de l'entrée affichée, sinon le titre du poster
    const legender = (id) => {
      if (!id) { etat.replaceChildren(...repos); return; }
      const b = boutons.get(id);
      const pastille = b.querySelector('.cadastre-pastille').cloneNode();
      pastille.style.setProperty('--pastille', b.style.getPropertyValue('--pastille'));
      const nom = document.createElement('strong');
      nom.textContent = b.querySelector('.cadastre-nom').textContent;
      const ligne = document.createElement('span');
      ligne.append(nom, ` · ${b.closest('.cadastre-groupe').dataset.libelle}`);
      etat.replaceChildren(pastille, ligne, b.querySelector('.cadastre-km').cloneNode(true));
    };
    const montrer = (id) => {
      boutons.forEach((b, k) => b.classList.toggle('est-active', k === id));
      legender(id);
      const visible = Boolean(id && etiquettes && emprises.has(id));
      if (visible && id !== dessinee) dessiner(id);
      cadre.classList.toggle('a-une-zone', visible);   // sans zone, le calque s'efface sur son dernier dessin
    };
    const actualiser = () => montrer(survolee || choisie);
    const choisir = (id) => {
      choisie = choisie === id ? 0 : id;
      boutons.forEach((b, k) => b.setAttribute('aria-pressed', String(k === choisie)));
      actualiser();
    };
    const zoneSous = (e) => {
      if (!etiquettes) return 0;
      const r = cadre.getBoundingClientRect();
      const x = Math.floor(((e.clientX - r.left) / r.width) * L), y = Math.floor(((e.clientY - r.top) / r.height) * H);
      return x >= 0 && y >= 0 && x < L && y < H ? etiquettes[y * L + x] : 0;
    };

    const liste = figure.closest('.cadastre-grille').querySelector('.cadastre-panneau');
    liste.addEventListener('pointerover', (e) => {
      const b = e.target.closest('.cadastre-cle');
      if (b && e.pointerType !== 'touch') { survolee = Number(b.dataset.zone); actualiser(); }
    });
    liste.addEventListener('pointerout', (e) => {
      const b = e.target.closest('.cadastre-cle');
      if (b && !b.contains(e.relatedTarget)) { survolee = 0; actualiser(); }
    });
    liste.addEventListener('focusin', (e) => { const b = e.target.closest('.cadastre-cle'); if (b) { survolee = Number(b.dataset.zone); actualiser(); } });
    liste.addEventListener('focusout', () => { survolee = 0; actualiser(); });
    liste.addEventListener('click', (e) => { const b = e.target.closest('.cadastre-cle'); if (b) choisir(Number(b.dataset.zone)); });

    cadre.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      const id = zoneSous(e);
      cadre.classList.toggle('sur-une-zone', Boolean(id));
      if (id !== survolee) { survolee = id; actualiser(); }
    });
    cadre.addEventListener('pointerleave', () => {
      cadre.classList.remove('sur-une-zone');
      if (survolee) { survolee = 0; actualiser(); }
    });
    // Toucher ou cliquer une zone la choisit ; ailleurs sur le poster, le choix est levé
    cadre.addEventListener('click', (e) => {
      const id = zoneSous(e);
      if (id) choisir(id); else if (choisie) choisir(choisie);
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && choisie) choisir(choisie); });

    // Carte d'étiquettes lue à l'approche de la section : niveaux de gris → entrées, et emprise de chacune
    const charger = () => {
      const image = new Image();
      image.src = calque.dataset.etiquettes;
      image.decode().then(() => {
        const toile = document.createElement('canvas');
        toile.width = L;
        toile.height = H;
        const c = toile.getContext('2d', { willReadFrequently: true });
        c.drawImage(image, 0, 0, L, H);
        const gris = c.getImageData(0, 0, L, H).data;
        etiquettes = new Uint8Array(L * H);
        for (let i = 0; i < L * H; i++) {
          const id = Math.round(gris[i * 4] / 10);
          if (!id) continue;
          etiquettes[i] = id;
          const x = i % L, y = (i - x) / L, e = emprises.get(id);
          if (!e) { emprises.set(id, [x, y, x, y]); continue; }
          if (x < e[0]) e[0] = x;
          if (x > e[2]) e[2] = x;
          e[3] = y;
        }
        actualiser();
      }).catch(() => {});   // sans carte d'étiquettes, le poster et la liste restent lisibles
    };
    new IntersectionObserver((entrees, guetteur) => {
      if (!entrees.some((e) => e.isIntersecting)) return;
      guetteur.disconnect();
      charger();
    }, { rootMargin: '600px 0px' }).observe(figure);
  }

  /* ─── Gestion des cookies : refus de la mesure d'audience ───
     Sur le site WordPress, l'interrupteur pilote Matomo (_paq). Dans la maquette, sans Matomo, il pose lui-même
     le cookie de refus que Matomo lit (mtm_consent_removed), pour que le choix survive au rechargement. */
  const choixMesure = document.querySelector('[data-mesure-audience]');
  if (choixMesure) {
    const interrupteur = choixMesure.querySelector('input');
    const etat = choixMesure.querySelector('.choix-mesure-etat');
    const afficher = (accepte) => {
      interrupteur.checked = accepte;
      etat.textContent = accepte
        ? t('Acceptée : vos visites sont comptées de façon anonyme.', 'Accepted: your visits are counted anonymously.')
        : t('Refusée : vos visites ne sont plus comptées.', 'Refused: your visits are no longer counted.');
    };
    const matomo = window._paq;
    if (matomo) matomo.push([function () { afficher(!this.isUserOptedOut()); }]);
    else afficher(!/(?:^|; )mtm_consent_removed=/.test(document.cookie));
    interrupteur.addEventListener('change', () => {
      const accepte = interrupteur.checked;
      if (matomo) matomo.push([accepte ? 'forgetUserOptOut' : 'optUserOut']);
      else document.cookie = accepte
        ? 'mtm_consent_removed=; max-age=0; path=/; SameSite=Lax'
        : `mtm_consent_removed=${Date.now()}; max-age=${60 * 60 * 24 * 395}; path=/; SameSite=Lax`;
      afficher(accepte);
    });
  }
  // Même page : l'accord donné aux cartes Google Maps de la page Contact, que l'on peut retirer ou donner ici
  const choixCartes = document.querySelector('[data-cartes-google]');
  if (choixCartes) {
    const interrupteur = choixCartes.querySelector('input');
    const etat = choixCartes.querySelector('.choix-mesure-etat');
    const afficher = (accepte) => {
      interrupteur.checked = accepte;
      etat.textContent = accepte
        ? t('Autorisées : la carte de la page Contact s’affiche directement.', 'Allowed: the map on the Contact page is shown directly.')
        : t('Non autorisées : la carte ne s’affiche qu’après votre accord.', 'Not allowed: the map is only shown once you agree.');
    };
    afficher(accordCartes.lire());
    interrupteur.addEventListener('change', () => { accordCartes.ecrire(interrupteur.checked); afficher(interrupteur.checked); });
  }

  /* ─── Formulaires (contact, lettre d'information, candidature) : contrôlés par le navigateur, puis envoyés sans quitter
         la page vers l'adresse de leur attribut action (service d'envoi, en attendant les formulaires WordPress).
         Sans adresse, rien n'est transmis et le message le dit. aria-invalid suit :user-invalid pour les lecteurs d'écran. ─── */
  const ADRESSE_CONTACT = 'contact@gabonoil.com';
  document.querySelectorAll('form[data-envoi]').forEach((f) => {
    const statut = f.querySelector('.statut-formulaire');
    const bouton = f.querySelector('[type="submit"]');
    const dire = (texte, etat, avecAdresse = false) => {
      statut.dataset.etat = etat;
      statut.replaceChildren(texte);
      if (avecAdresse) {
        const lien = document.createElement('a');
        lien.href = `mailto:${ADRESSE_CONTACT}`;
        lien.textContent = ADRESSE_CONTACT;
        statut.append(lien, '.');
      }
    };
    const signaler = (champ) => { if (champ.willValidate) champ.setAttribute('aria-invalid', String(champ.matches(':user-invalid'))); };
    f.addEventListener('focusout', (e) => signaler(e.target));
    f.addEventListener('input', (e) => { if (e.target.hasAttribute('aria-invalid')) signaler(e.target); });
    f.addEventListener('invalid', (e) => e.target.setAttribute('aria-invalid', 'true'), true);   // envoi tenté avec un champ à corriger
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const adresse = f.getAttribute('action');
      if (!adresse || adresse === '#') {
        dire(t("L'envoi en ligne n'est pas encore activé : rien n'a été transmis. Pour nous joindre dès maintenant, écrivez à ",
          'Online sending is not yet enabled: nothing has been sent. To reach us now, write to '), 'info', true);
        return;
      }
      bouton.disabled = true;   // pas de double envoi
      dire(t('Envoi en cours…', 'Sending…'), 'attente');
      try {
        const reponse = await fetch(adresse, { method: 'POST', body: new FormData(f), headers: { Accept: 'application/json' } });
        if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`);
        f.reset();
        f.querySelectorAll('[aria-invalid]').forEach((c) => c.removeAttribute('aria-invalid'));
        dire(f.dataset.merci, 'ok');
      } catch {
        dire(t("L'envoi n'a pas abouti. Réessayez dans un instant, ou écrivez-nous à ", 'Sending failed. Please try again in a moment, or write to us at '), 'erreur', true);
      } finally {
        bouton.disabled = false;
      }
    });
  });
})();
