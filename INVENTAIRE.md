# Inventaire de la maquette GOC (19/10/2026)

Les 8 écrans Banani sont reproduits en 7 pages. Les écrans « Contact » et « Contact sans modale » forment une seule page, et la candidature s'ouvre en fenêtre. S'y ajoutent les mentions légales et la politique de confidentialité, composées avec les éléments Banani.
## Actualités : fonctionnement (préfiguration de WordPress)

- **Source unique** : `sources/actualites.json`. Chaque article a un titre, un slug, **une catégorie**, une date, un extrait, une image à la une, une galerie facultative et son contenu. Ce sont les champs d'un article WordPress.
- **Accueil** : les **3 articles les plus récents**, automatiquement. Ce sera une boucle de requête de 3 articles dans WordPress.
- **Page Actualités** : les **20 plus récents**, du plus récent au plus ancien, avec un filtre par catégorie. Seules les catégories qui ont des articles s'affichent. Le filtre est fait de liens vers les archives de catégorie (`?categorie=…` dans la maquette). Dans WordPress, ce sera le modèle `home.html` (20 articles par page) avec les archives de catégorie.
- **Page article** : modèle `single.html`, généré pour chaque article. « À lire aussi » propose d'abord la même catégorie, puis les plus récents.
- **Catégories** : Acquisition, Partenariat, Sites et opérations, Filiales, Nomination, Transformation. Elles sont à ajuster dans le fichier, puis dans WordPress.
- **Articles du site de référence** (8) : textes d'origine, reclassés dans ces catégories. Les photos d'origine générées par IA (Addax, SMP, GOP, Gab'Oil) sont remplacées par des photos du client (voir la partie 4).
- **Articles d'archives** (5, `"archive": true`) : composés à partir de la frise historique, illustrés par ses vignettes. Ils sont à valider, compléter ou supprimer : Bourbon (2014), Mboga II (2016), Perenco (2018), Dussafu et Ezanga (2019), Dinonga et Irondu (2024).
- **Lettre d'information** : formulaire de démonstration, à brancher sur un service d'envoi (extension WordPress).

## Diaporama d'accueil : fonctionnement (préfiguration de WordPress)

- **Source unique** : `sources/diaporama-accueil.json`, mis en forme par `scripts/diaporama.js`. Chaque diapositive a un fond (vidéo ou photo), une durée, un sur-titre, un titre, un chapô et ses boutons (texte, lien, style). Dans WordPress, ce sera un bloc « Diaporama d'accueil » : une liste répétable de diapositives modifiable depuis l'administration.
- **Déroulé** : 3 diapositives en boucle, avec un fondu enchaîné entre chaque fond. La vidéo du site en forêt (`video/hero-goc-720p.mp4`, 15 s, sans son) joue jusqu'au bout, puis vient la photo des opérateurs entre les réservoirs d'Obangué (8 s), puis la vidéo du champ Sardine (`video/hero-sardine-720p.mp4`, 15 s). À chaque fond, la légende et les deux boutons changent. La vidéo suivante se charge pendant la diapositive précédente.
- **Diapositive 1** (vidéo) : « Leader du secteur pétrolier au Gabon », avec les boutons « Découvrir le groupe » et « Nos activités ». Son titre est le titre principal de la page (h1).
- **Diapositive 2** (photo) : « 15 ans d'expertise », avec les boutons « Notre histoire » et « Nos filiales ». Le texte vient du carrousel du site de référence.
- **Diapositive 3** (vidéo Sardine) : « Développement du champ offshore Sardine », sous le sur-titre « Projets stratégiques », avec les boutons « Exploration et production » et « Projets stratégiques ». Le texte vient de la liste des projets stratégiques du site de référence. Le second bouton mène à la page `projets-strategiques.html`, qui reste à créer, comme la carte de l'accueil.
- **Petits écrans peu hauts** (téléphones en paysage) : les commandes passent sur leur propre ligne, sous la légende, quel que soit le nombre de diapositives. Sous 340 px de haut, le chapô est masqué.
- **Commandes** : un repère par diapositive, avec une barre de progression, et un bouton pause. Le diaporama s'arrête aussi quand le hero sort de l'écran, quand l'onglet est masqué, quand la souris est sur la légende (pour ne pas changer les boutons sous le pointeur) et dès que le clavier entre dans le hero. Si la personne a demandé à réduire les animations, rien ne bouge : l'affiche de la vidéo s'affiche, et le bouton permet de lancer le diaporama.
- **Fichiers** : `scripts/preparer-images.sh` place la vidéo en tête de lecture rapide (sans réencodage) et prépare son affiche `img/hero-video-affiche.jpg`, qui est préchargée. Une version 1080p (MP4 et WebM) est disponible dans les fichiers du client si la netteté sur grand écran doit être améliorée.
- **Hébergement** : le serveur doit accepter les requêtes partielles (en-tête `Range`). C'est le cas d'Apache et de Nginx par défaut, et le serveur de la maquette le fait aussi. Sinon, la vidéo ne peut pas repartir du début à chaque tour.

## Rapport en ligne : fonctionnement (préfiguration de WordPress)

- **Emplacement** : page Activités et engagements, dernière section. La carte du rapport (`#rapports`) remplace l'ancien bouton « Consulter les rapports annuels ».
- **Document** : `maquette/documents/dossier-gabon-2026-snhg.pdf`. C'est le dossier « SNHG : le Gabon définit son destin énergétique » (Économies Africaines, édition Gabon 2026, 8 pages, 3,9 Mo), copié depuis `gaboil/public/documents/`. L'original reste dans `gaboil`.
- **Deux actions** :
  - « Lire en ligne » ouvre une liseuse plein écran sur la page. Les pages y sont dessinées par PDF.js (`maquette/js/pdfjs/`, Mozilla, licence Apache 2.0), ce qui fonctionne sur tous les appareils, y compris Android, qui n'affiche pas les PDF dans une page. PDF.js n'est chargé qu'à la première ouverture. Sans JavaScript, le lien ouvre le PDF dans un nouvel onglet.
  - « Télécharger le PDF » enregistre le fichier sous le nom `SNHG-Dossier-Gabon-2026.pdf`. Le même bouton figure dans la liseuse.
- **Couverture** : `img/documents/dossier-gabon-2026-couverture.jpg`, la première page du PDF dessinée par PDF.js (480 px). Elle est à refaire si le document change.
- **WordPress** : un bloc Fichier (PDF de la médiathèque, avec bouton de téléchargement), accompagné d'une image et d'un texte. Le script du thème ajoute la liseuse. Le client n'aura qu'à téléverser un nouveau PDF.

## Médiathèque : fonctionnement (préfiguration de WordPress)

- **Emplacement** : menu « Information et contact » (en-tête, menu mobile et plan du pied de page), entre Actualités et Carrières, et dans la sous-navigation de la page Actualités et des articles. La page est `maquette/mediatheque.html`.
- **Source unique** : `sources/mediatheque.json`, mis en forme par `scripts/mediatheque.js`. Chaque galerie a un slug, un titre, un type de site, une description et ses photos (fichier d'origine et texte alternatif). L'ordre du fichier est celui de la page.
- **Galeries** : une par dossier du reportage « Opérations GOC » fourni par le client, 46 photos au total : Sardine (7), Tsiengui (7), Mboumba (7), Obangué (7), Mandji (6), Port-Gentil (6), Libreville (6). Les photos retenues mettent en avant les installations, les équipes au travail et le savoir-faire technique.
- **Mise en page** : un sommaire en pastilles mène à chaque galerie. La première photo de chaque galerie est mise en avant (case double), en mosaïque sans trou de 6 ou 7 photos.
- **Visionneuse** : un clic sur une photo l'ouvre en grand, avec sa légende (le texte alternatif) et sa position (« 3 / 7 »). On passe d'une photo à l'autre avec les flèches du clavier, les boutons ou un glissement du doigt. Échap, le bouton ou un clic à côté de la photo la ferme. Sans JavaScript, le lien ouvre la photo en grand.
- **Fichiers** : `scripts/preparer-mediatheque.js` produit, depuis les photos d'origine (4 600 à 7 000 px, hors du dépôt), une vignette de 800 px et une grande image de 1 600 px par photo dans `img/mediatheque/<galerie>/`, et la photo d'ouverture (`img/mediatheque/ouverture.jpg`, champ de Tsiengui). Il faut `ffmpeg`. Le dossier pèse 12 Mo.
- **WordPress** : une page Médiathèque avec un bloc Galerie par site (titre, texte et photos de la médiathèque WordPress). Le script du thème ajoute la visionneuse. Le client pourra ajouter une galerie ou changer une photo sans toucher au code. Pour un grand nombre de galeries, une extension d'albums prendra le relais.

## Engagements HSEI et RSE : fonctionnement (préfiguration de WordPress)

- **Pages** : `maquette/engagements-hsei.html` et `maquette/engagements-rse.html`, dans le menu « Activités et engagements » (« Engagements HSEI », « Engagements RSE »). Les blocs HSSE et RSE de la page Activités et engagements y renvoient. Les deux pages renvoient l'une à l'autre.
- **Contenu** : les grandes lignes des deux documents du client (« Engaments HSEI.pdf » et « Nos engagements RSE .pdf », 20/10/2026). Chaque page présente l'approche, une carte par politique (devise, explication courte, engagements clés), puis une phrase de conclusion. La page HSEI ajoute les 10 Règles d'or, retranscrites en texte (les fautes de l'affiche, « vchute » et « dindividuel », sont corrigées).
- **Documents** : `documents/goc-engagements-hsei.pdf` (5 pages, 573 Ko) et `documents/goc-engagements-rse.pdf` (5 pages, 706 Ko). Ce sont les documents remis en forme par le client (« GOC_Nos-engagements-HSEI.pdf » et « GOC_Nos-engagements-RSE.pdf », 20/10/2026). Ils se lisent en ligne dans la liseuse PDF.js ou se téléchargent sous les noms `GOC-Engagements-HSEI.pdf` et `GOC-Engagements-RSE.pdf`, comme le rapport de la page Activités. Pour une nouvelle version, il suffit de déposer le PDF sous le même nom. Il faut ensuite mettre à jour le nombre de pages et le poids dans la carte et dans la liseuse, puis redessiner la couverture (`img/documents/goc-engagements-*-couverture.jpg`, première page en 480 px).
- **À corriger dans les PDF** (par le client, à la source) : le pied de chaque page (« Gabon Oil Company — Société Nationale des Hydrocarbures du Gabon ») et le titre enregistré dans les propriétés des fichiers contiennent un tiret cadratin.
- **Photos** : produites par `scripts/preparer-photos.js` (`hsei-hero`, `hsei-approche`, `rse-hero`, `rse-approche`) : un opérateur sous masque respiratoire, un point sécurité devant le tableau HSSE de Mboumba, le village de Mandji vu du ciel, deux opérateurs au bord du fleuve.
- **WordPress** : deux pages composées de blocs : Bannière, Média et texte, Colonnes de cartes, Groupe sombre pour les Règles d'or, Fichier pour le PDF. Le script du thème ajoute la liseuse.

Ce document liste ce qui reste à faire : les pages liées mais pas encore créées, les photos à remplacer et les textes à revoir.

## 1. Pages créées

| Page | Fichier | Écran Banani |
|---|---|---|
| Accueil | `maquette/index.html` | Accueil |
| Présentation du groupe | `maquette/presentation-groupe.html` | PresentationGroupe |
| Historique et gouvernance | `maquette/historique-gouvernance.html` | HistoriqueGouvernance |
| Filiales et entités | `maquette/filiales.html` | Filiales |
| Activités et engagements | `maquette/activites-engagements.html` | ActivitiesCommitments |
| Exploration et production | `maquette/exploration-production.html` | ActivitiesExploration |
| Contact (et fenêtre de candidature) | `maquette/contact.html` | Contact + ContactNoModal |
| Mentions légales | `maquette/mentions-legales.html` | aucun : éléments Banani (sous-navigation, ouverture, étiquettes et encadré du Contact) |
| Politique de confidentialité | `maquette/confidentialite.html` | idem |
| Gestion des cookies | `maquette/cookies.html` | idem, avec un tableau des cookies et un interrupteur de refus de la mesure d'audience |
| Actualités (liste filtrable) | `maquette/actualites.html` | aucun : cartes d'actualité de l'accueil, sous-navigation, ouverture |
| Médiathèque (7 galeries, 46 photos) | `maquette/mediatheque.html` | aucun : sous-navigation, ouverture, pastilles des actualités, fenêtres des autres pages |
| Engagements HSEI | `maquette/engagements-hsei.html` | aucun : composants des pages Activités, Présentation et Exploration (ouverture, cartes, appel, carte du rapport) |
| Engagements RSE | `maquette/engagements-rse.html` | idem |
| Articles (13 pages) | `maquette/actualite-<slug>.html` | aucun : en-tête éditorial, colonne de lecture, « À lire aussi » |

On modifie les sources dans `sources/pages/*.html`, ainsi que l'en-tête et le pied communs dans `sources/gabarit.html`.
La commande `node scripts/assembler-pages.js` régénère `maquette/`. Avec `--surveiller`, la régénération se fait à chaque enregistrement.

## 2. Pages liées mais pas encore créées

Ces liens existent déjà dans la maquette. Ils mènent aujourd'hui à une page introuvable (erreur 404).

| Page à créer | Lien attendu | Où se trouve le lien | Contenu disponible sur snhg.vercel.app | Modèle Banani à réutiliser |
|---|---|---|---|---|
| Projets stratégiques | `projets-strategiques.html` | Menu Activités, sous-navigation Exploration, pied de page | Rubrique « Projets Stratégiques » | Exploration-production : ouverture, points forts, aspects |
| Distribution et transformation (aval) | `distribution-transformation.html` | Sous-navigation et bouton d'appel de la page Exploration-production | Textes aval de « Nos activités » (Gab'Oil, Pizolub) | Exploration-production |
| Services pétroliers | `services-petroliers.html` | Sous-navigation et bouton d'appel de la page Exploration-production | Textes SMP de « Nos activités » | Exploration-production |
| Version anglaise | lien « EN » (`#` pour l'instant) | Sélecteur de langue, en-tête et menu mobile | Le site de référence a une version `/en` | Toutes les pages, traduites |

La page Publications (`publications.html`) n'est plus liée nulle part. Elle a été retirée du menu le 19/10/2026, à la demande du client, et le bouton « Consulter les rapports annuels » a été remplacé par la carte du rapport le 20/10/2026.

## 3. Pages présentes sur le site de référence, absentes de Banani (facultatives)

Pour l'instant, elles sont traitées comme des sections ou des ancres des pages existantes. Une page dédiée peut être créée plus tard.

| Sujet | Traitement actuel | Page dédiée possible |
|---|---|---|
| Carrières | Fenêtre de candidature dans `contact.html#candidature` | `carrieres.html` (offres d'emploi, vie à la SNHG) |
| Chaque filiale (Assala, SMP, Pizolub, Gab'Oil, GOP) | Cartes avec ancres dans `filiales.html` | Une page par filiale, comme sur le site de référence |
| Exploration / Production séparées | Ancres `#exploration` et `#production` dans `exploration-production.html` | Deux pages, comme sur le site de référence |

## 4. Photos

**Toutes les photos du site sont réelles depuis le 20/10/2026.** Les visuels générés par IA ont été retirés : ceux de la maquette Banani, et ceux du site de référence SNHG, qui portent la marque Gemini (étoile à quatre branches dans le coin). Les remplaçantes viennent des reportages du client (« Opérations GOC », « Bureaux et staffs », « Station »). Elles sont choisies pour coller à l'idée de chaque section, puis recadrées par `scripts/preparer-photos.js` dans `img/photos/`, en 1536 et 768 px. Le cadrage fin des ouvertures se règle par un point focal sur l'image (`style="object-position: …"`), comme le point focal du bloc Bannière de WordPress.

| Page et section | Fichier (`img/photos/`) | Photo du client |
|---|---|---|
| Accueil, diapositive 2 « 15 ans d'expertise » | `accueil-expertise` | Deux opérateurs entre les réservoirs, Obangué |
| Accueil, « Qui sommes-nous » | `accueil-qui-sommes-nous` (portrait) | Opérateur GOC, bras croisés, sur site |
| Accueil, cartes Exploration, Production, Projets stratégiques | `accueil-exploration`, `accueil-production`, `accueil-projets` | Tour de forage (Sardine), opérateur à la vanne, nouvelle installation vue du ciel (Mandji) |
| Accueil, « Bâtir un avenir énergétique responsable » | `accueil-engagements` | Réunion sécurité HSSE, Mboumba |
| Accueil, « Cap vers 2030 » | `accueil-cap-2030` | Champ de Tsiengui dans la forêt, vue aérienne |
| Présentation : ouverture, « Qui sommes-nous ? », Vision | `presentation-hero`, `presentation-apropos`, `presentation-vision` | Opérateur devant les drapeaux (Mboumba), réunion d'équipe à Libreville, tête de puits en forêt (Tsiengui) |
| Historique et gouvernance | `historique-hero` | Opérateur GOC face aux drapeaux du Gabon, Mboumba |
| Filiales | `filiales-hero` | Station Gab'Oil |
| Activités et engagements | `activites-hero` | Opérateur devant les réservoirs, Tsiengui |
| Exploration et production : ouverture, section amont | `exploration-hero`, `exploration-salle-controle` | Opérateur aux têtes de puits (Sardine), salle de contrôle de Tsiengui |
| Contact | `contact-hero` | Collaborateur au service d'une collègue, bureaux de Port-Gentil |
| Actualités | `actualites-hero` | Visite officielle dans les bureaux |
| Mentions légales, Confidentialité | `mentions-legales-hero`, `confidentialite-hero` | Bureaux de Port-Gentil |
| Gestion des cookies | `cookies-hero` | Collaborateur à son poste informatique, bureaux de Libreville |
| Articles Addax, SMP, GOP, Gab'Oil | `actu-addax-tsiengui`, `actu-addax-obangue`, `actu-smp`, `actu-gop`, `actu-gaboil-station` | Champs repris de Tsiengui et d'Obangué, opérateur en salle électrique, réunion à Libreville, inauguration d'une station Gab'Oil (titre incrusté retiré) |

Les autres photos d'actualité (nominations, Assala, Pizolub, modernisation) viennent du site SNHG et ne portent pas de marque d'IA. La photo de « La SNHG en chiffres » est celle de la cérémonie de signature du rachat d'Assala (`img/accueil/assala-signature.jpg`, recadrée sur les quatre personnes). Les portraits du conseil d'administration et du comité de direction (`img/gouvernance/`) sont les vraies photos SNHG, recadrées en 160 px.

**Frise des dates clés (Historique)** : 13 vignettes illustrées en SVG dans `img/frise/`, générées par `scripts/creer-vignettes-frise.js`. Ce sont des dessins, pas des photos. Ils sont à garder tels quels ou à remplacer par des photos d'archives : il suffit de changer le `src` dans `sources/pages/historique-gouvernance.html`.
Le logo Gab'Oil est à confirmer dans une meilleure définition.

## 5. Textes recomposés à relire

Les textes viennent de snhg.vercel.app, mot pour mot quand c'était possible. Là où Banani demandait plus d'éléments que le site n'en fournit, j'ai assemblé des phrases du site :

- **Présentation, missions** : les 4 cartes reprennent les missions SNHG. La 4e, sur la transition énergétique, est reformulée.
- **Activités, engagements** : les 4 thèmes (Environnement, RSE, Gouvernance, HSSE) ont chacun 4 puces tirées des phrases du site.
- **Activités et Exploration, encadrés d'appel** : titres et phrases de conclusion recomposés.
- **Exploration, points forts** : 4 chiffres (27 000 b/j, 90 000 b/j, Dinonga/Irondu, participations CEPP) à faire valider.
- **Historique, frise** : 13 dates, de 2011 à « Cap vers 2030 », à vérifier.
- **Gouvernance** : les deux ministères de tutelle tiennent la place du haut de l'organigramme Banani. L'administrateur directeur général figure dans le comité de direction.
- **Filiales** : la carte GOC est classée dans « Amont ». La carte GOP renvoie vers l'historique, faute de site officiel.
- **Contact** : la section « Bureaux régionaux » de Banani est retirée, à ta demande. Le champ « Sujet » est une saisie libre.
- **Gouvernance** : Marcellin SIMBA NGABI figure aussi parmi les administrateurs du conseil (en premier, comme sur le site de référence), en plus de son rôle d'ADG au comité de direction.
- **Pages légales** : textes du site de référence mot pour mot. Seuls les chapeaux d'ouverture et la date de mise à jour sont nouveaux.
- **Gestion des cookies** : page rédigée à neuf (le site de référence n'en avait pas), d'après les choix conseillés le 20/10/2026 : aucun cookie publicitaire ni de réseau social, mesure d'audience Matomo dispensée de consentement, donc pas de bandeau. La politique de confidentialité renvoie désormais vers cette page.

## 5 bis. Informations légales à fournir avant la mise en ligne

Ces informations sont surlignées en jaune dans la maquette.

- **Adresse du site** : le site de référence indiquait `snhg-web.vercel.app`.
- **Hébergeur** : nom, adresse et site web. Le site WordPress ne sera pas hébergé chez Vercel, qui hébergeait le site de référence.
- **À valider par le service juridique** : faut-il ajouter le numéro RCCM, le NIF et le capital social de la SNHG ? Faut-il citer la loi gabonaise sur la protection des données personnelles et le recours auprès de l'autorité de contrôle (CNPDCP) ?
- **Formulaire de contact** : la politique mentionne le téléphone, mais le formulaire ne le demande pas. Il faut aligner l'un sur l'autre.
- **Cookies** : le tableau de `cookies.html` décrit la configuration conseillée (langue par Polylang, Matomo installé avec le site). Il faut l'ajuster aux extensions réellement installées : noms et durées des cookies, et tout cookie ajouté par l'hébergeur ou un pare-feu (Cloudflare, par exemple). La page cite déjà la CNPDCP.

## 6. À brancher lors de la phase 4 (thème WordPress)

- **Formulaires** : le formulaire de contact et la candidature affichent pour l'instant « Formulaire de démonstration ».
- **Mesure d'audience** : installer Matomo (extension Matomo for WordPress) avec les adresses IP anonymisées et les réglages de dispense de consentement. L'interrupteur de la page Cookies le pilote déjà par `_paq` (`optUserOut`, `forgetUserOptOut`). Dans la maquette, sans Matomo, il pose lui-même le cookie de refus.
- **Newsletter** : présente sur le site de référence, absente de Banani.
- **Réseaux sociaux** : liens présents sur le site de référence, absents de Banani.
