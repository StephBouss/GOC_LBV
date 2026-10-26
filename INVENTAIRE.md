# Inventaire de la maquette GOC (mis à jour le 24/10/2026)

Les 8 écrans Banani sont reproduits en 7 pages : les écrans « Contact » et « Contact sans modale » ont donné la page Contact et le formulaire de candidature, aujourd'hui sur la page « Formulaire de souscription » de la rubrique Carrières. Le site compte désormais 21 pages et 13 articles par langue, soit 68 pages (liste en partie 1).

## Actualités : fonctionnement (préfiguration de WordPress)

- **Source unique** : `sources/actualites.json`. Chaque article a un titre, un slug, **une catégorie**, une date, un extrait, une image à la une, une galerie facultative et son contenu. Ce sont les champs d'un article WordPress.
- **Accueil** : les **3 articles les plus récents**, automatiquement. Ce sera une boucle de requête de 3 articles dans WordPress.
- **Page Actualités** : les **20 plus récents**, du plus récent au plus ancien, avec un filtre par catégorie. Seules les catégories qui ont des articles s'affichent. Le filtre est fait de liens vers les archives de catégorie (`?categorie=…` dans la maquette). Dans WordPress, ce sera le modèle `home.html` (20 articles par page) avec les archives de catégorie.
- **Page article** : modèle `single.html`, généré pour chaque article. « À lire aussi » propose d'abord la même catégorie, puis les plus récents.
- **Catégories** : Acquisition, Partenariat, Sites et opérations, Filiales, Nomination, Transformation. Elles sont à ajuster dans le fichier, puis dans WordPress.
- **Articles du site de référence** (8) : textes d'origine, reclassés dans ces catégories. Les photos d'origine générées par IA (Addax, SMP, GOP, Gab'Oil) sont remplacées par des photos du client (voir la partie 4).
- **Articles d'archives** (5, `"archive": true`) : composés à partir de la frise historique, illustrés par ses vignettes. Ils sont à valider, compléter ou supprimer : Bourbon (2014), Mboga II (2016), Perenco (2018), Dussafu et Ezanga (2019), Dinonga et Irondou (2024).
- **Lettre d'information** : formulaire avec case de consentement, prêt à être relié à un outil d'envoi (voir « Formulaires » plus bas).
- **Texte alternatif** : chaque photo à la une a un champ `alt` qui la décrit (cartes et page de l'article). Les vignettes SVG de la frise, décoratives, n'en ont pas.

## Diaporama d'accueil : fonctionnement (préfiguration de WordPress)

- **Source unique** : `sources/diaporama-accueil.json`, mis en forme par `scripts/diaporama.js`. Chaque diapositive a un fond (vidéo ou photo), une durée, un sur-titre, un titre, un chapô et ses boutons (texte, lien, style). Dans WordPress, ce sera un bloc « Diaporama d'accueil » : une liste répétable de diapositives modifiable depuis l'administration.
- **Déroulé** : 3 diapositives en boucle, avec un fondu enchaîné entre chaque fond. La vidéo du site en forêt (`video/hero-goc-720p.mp4`, 15 s, sans son) joue jusqu'au bout, puis vient la photo des opérateurs entre les réservoirs d'Obangué (8 s), puis la vidéo du champ Sardine (`video/hero-sardine-720p.mp4`, 15 s). À chaque fond, la légende et les deux boutons changent. La vidéo suivante se charge pendant la diapositive précédente.
- **Diapositive 1** (vidéo) : « Leader du secteur pétrolier au Gabon », avec les boutons « Découvrir le groupe » et « Nos activités ». Son titre est le titre principal de la page (h1).
- **Diapositive 2** (photo) : « 15 ans d'expertise », avec les boutons « Notre histoire » et « Nos filiales ». Le texte vient du carrousel du site de référence.
- **Diapositive 3** (vidéo Sardine) : « Développement du champ offshore Sardine », sous le sur-titre « Projets stratégiques », avec les boutons « Exploration et production » et « Projets stratégiques ». Le texte vient de la liste des projets stratégiques du site de référence. Le second bouton mène à la page `activites/projets-strategiques.html`, comme la carte de l'accueil.
- **Petits écrans peu hauts** (téléphones en paysage) : les commandes passent sur leur propre ligne, sous la légende, quel que soit le nombre de diapositives. Sous 340 px de haut, le chapô est masqué.
- **Commandes** : un repère par diapositive, avec une barre de progression, et un bouton pause. Le diaporama s'arrête aussi quand le hero sort de l'écran, quand l'onglet est masqué, quand la souris est sur la légende (pour ne pas changer les boutons sous le pointeur) et dès que le clavier entre dans le hero. Si la personne a demandé à réduire les animations, rien ne bouge : l'affiche de la vidéo s'affiche, et le bouton permet de lancer le diaporama.
- **Fichiers** (audit du 20/10/2026) : `scripts/preparer-images.sh` réencode chaque vidéo depuis le 1080p du client en 1280 × 720, en WebM (VP9, proposé en premier : 0,79 et 1,19 Mo) et en MP4 (H.264, pour les autres navigateurs : 1,22 et 1,35 Mo), contre 3,1 et 3,0 Mo auparavant. Il prépare aussi les affiches (`img/hero-video-affiche.jpg`, préchargée).
- **Téléphones et économie de données** : sous 768 px de large, ou si le navigateur demande d'économiser les données, aucune vidéo n'est téléchargée. L'affiche reste à sa place et la diapositive dure « duree » secondes. Sur ordinateur, rien n'est téléchargé avant la lecture (`preload="none"`), et la vidéo suivante se charge pendant la diapositive précédente. L'accueil pèse 1,3 Mo sur ordinateur et 0,4 Mo sur téléphone à l'ouverture (3,7 Mo avant).
- **Hébergement** : le serveur doit accepter les requêtes partielles (en-tête `Range`). C'est le cas d'Apache et de Nginx par défaut, et le serveur de la maquette le fait aussi. Sinon, la vidéo ne peut pas repartir du début à chaque tour.

## Rapport en ligne : fonctionnement (préfiguration de WordPress)

- **Emplacement** : page Activités et engagements, dernière section. La carte du rapport (`#rapports`) remplace l'ancien bouton « Consulter les rapports annuels ».
- **Document** : `documents/dossier-gabon-2026-snhg.pdf`. C'est le dossier « SNHG : le Gabon définit son destin énergétique » (Économies Africaines, édition Gabon 2026, 8 pages, 3,9 Mo), copié depuis `gaboil/public/documents/`. L'original reste dans `gaboil`.
- **Deux actions** :
  - « Lire en ligne » ouvre une liseuse plein écran sur la page. Les pages y sont dessinées par PDF.js (`js/pdfjs/`, Mozilla, licence Apache 2.0), ce qui fonctionne sur tous les appareils, y compris Android, qui n'affiche pas les PDF dans une page. PDF.js n'est chargé qu'à la première ouverture. Sans JavaScript, le lien ouvre le PDF dans un nouvel onglet.
  - « Télécharger le PDF » enregistre le fichier sous le nom `SNHG-Dossier-Gabon-2026.pdf`. Le même bouton figure dans la liseuse.
- **Couverture** : `img/documents/dossier-gabon-2026-couverture.jpg`, la première page du PDF dessinée par PDF.js (480 px). Elle est à refaire si le document change.
- **WordPress** : un bloc Fichier (PDF de la médiathèque, avec bouton de téléchargement), accompagné d'une image et d'un texte. Le script du thème ajoute la liseuse. Le client n'aura qu'à téléverser un nouveau PDF.

## Médiathèque : fonctionnement (préfiguration de WordPress)

- **Emplacement** : menu « Informations » (en-tête, menu mobile et plan du pied de page), entre Actualités et Carrières, et dans la sous-navigation de la page Actualités et des articles. La page est `mediatheque/index.html`.
- **Source unique** : `sources/mediatheque.json`, mis en forme par `scripts/mediatheque.js`. Chaque galerie a un slug, un titre, un type de site, une description et ses photos (fichier d'origine et texte alternatif). L'ordre du fichier est celui de la page.
- **Galeries** : une par dossier du reportage « Opérations GOC » fourni par le client, 49 photos au total : Sardine (7), Tsiengui (7), Mboumba (7), Obangué (7), Akondo (3), Mandji (6), Port-Gentil (6), Libreville (6). Les photos retenues mettent en avant les installations, les équipes au travail et le savoir-faire technique. Akondo (ajouté le 23/10/2026) vient d'un envoi séparé du client, copié dans le dossier « Opérations GOC/Akondo » : 3 vues aériennes de 960 × 540 px (le client en a envoyé 4, dont 2 fichiers identiques). Ces photos ne sont pas agrandies, et elles restent moins nettes que les autres : des originaux en haute définition seraient bienvenus.
- **Mise en page** : un sommaire en pastilles mène à chaque galerie. La première photo de chaque galerie est mise en avant (case double), en mosaïque sans trou de 3, 6 ou 7 photos (à 3 : deux photos empilées à droite).
- **Visionneuse** : un clic sur une photo l'ouvre en grand, avec sa légende (le texte alternatif) et sa position (« 3 / 7 »). On passe d'une photo à l'autre avec les flèches du clavier, les boutons ou un glissement du doigt. Échap, le bouton ou un clic à côté de la photo la ferme. Sans JavaScript, le lien ouvre la photo en grand.
- **Fichiers** : `scripts/preparer-mediatheque.js` produit, depuis les photos d'origine (4 600 à 7 000 px, hors du dépôt), une vignette de 800 px et une grande image de 1 600 px par photo (ou de la taille d'origine si elle est plus petite) dans `img/mediatheque/<galerie>/`, et la photo d'ouverture (`img/mediatheque/ouverture.jpg`, champ de Tsiengui). Il faut `ffmpeg`. Le dossier pèse 13 Mo.
- **WordPress** : une page Médiathèque avec un bloc Galerie par site (titre, texte et photos de la médiathèque WordPress). Le script du thème ajoute la visionneuse. Le client pourra ajouter une galerie ou changer une photo sans toucher au code. Pour un grand nombre de galeries, une extension d'albums prendra le relais.

## Stations Gab'Oil : fonctionnement (préfiguration de WordPress)

- **Page** : `activites/stations-gaboil.html` (`en/activities/gaboil-stations.html`), dans le menu « Activités et engagements » après Distribution et transformation, et dans la sous-navigation des pages d'activité. Créée le 24/10/2026 à la demande du client.
- **Source unique** : `sources/stations.json` (nom, ville, province, état `service`, `construction` ou `etudes`, latitude, longitude), mis en forme par `scripts/stations.js`. Les états, les noms de la carte et, au besoin, le nom d'une station se traduisent dans `sources/en/stations.json`. 23 stations, d'après la liste du client : 13 en service, 5 en construction, 5 en études. La page Distribution annonce « 27 stations visées » : à rapprocher de ces 23.
- **Carte** : fond SVG du Gabon (9 provinces, pays voisins, encart « Grand Libreville ») tiré de Natural Earth (domaine public) par `scripts/creer-carte-gabon.js` dans `sources/carte-gabon.json`. Position d'un point : x = (longitude − 7,2) × 100, y = (2,55 − latitude) × 100. Les stations de l'agglomération de Libreville sont dessinées dans l'encart agrandi. Les noms des provinces sont décalés là où ils couvriraient un point (`DECALAGES` du script).
- **Interaction** : survoler ou choisir une station dans la liste fait briller et pulser son point, avec une bulle (nom, lieu, état). Un clic sur un point choisit la station dans la liste. Des pastilles filtrent par état. Échap annule le choix. Sur tablette et mobile, la carte passe au-dessus de la liste, et choisir une station la ramène à l'écran.
- **Coordonnées provisoires** : toutes les positions sont celles du centre de la ville ou du quartier (`"position": "provisoire"`). Le client doit fournir la latitude et la longitude exactes de chaque station. Trois localités n'ont ni coordonnées ni province confirmée : Kum Yenguin, Makongogno (peut-être Makongonio, Ngounié) et Mikouyi (peut-être Mikouya, Ogooué-Lolo). Elles figurent dans la liste, sans point sur la carte.
- **Photo** (24/10/2026, demande client) : la bulle de la carte montre la photo de la station (champ « photo » facultatif de `sources/stations.json`). Seule Makokou en a une (la photo d'inauguration) ; les autres montrent le logo Gab'Oil en attendant leurs photos, à demander au client.
- **Orthographe normalisée** : Akébé, Lopé, Omboué, Bikélé ; « POG » devient Port-Gentil.
- **WordPress** : un type de contenu « Station » (champs ACF : nom, ville, province, état en liste de choix, latitude, longitude), traduit par Polylang. Le thème reprend la projection, le fond de carte, le CSS et le script : le client ajoute une station ou corrige sa position sans toucher au code.

## Cadastre pétrolier : fonctionnement (préfiguration de WordPress)

- **Place** : section `#cadastre` de `activites/exploration-production.html` (`en/activities/exploration-production.html`), entre les trois aspects et l'appel à l'action. Ajoutée le 26/10/2026 à la demande du client.
- **Poster tel quel** : le PDF « CADASTRE PETROLIER GABON SEPTEMBRE 2026 » de la DGAPG (service Cadastre pétrolier) n'est pas redessiné. Il est affiché en WebP de 900, 1350 et 1800 px (`img/cadastre/`). La version de 3600 px s'ouvre par « Agrandir la carte » (nouvel onglet). Le PDF se télécharge : `documents/cadastre-petrolier-gabon-septembre-2026.pdf`, 4,2 Mo.
- **Interaction** :
  - La légende du poster est reprise en liste (25 entrées) : Exploration (dont les 4 zones AET hachurées), Exploitation et Blocs libres, avec les couleurs et les surfaces du poster.
  - Survoler, toucher ou atteindre au clavier une entrée voile le reste du poster et détoure ses zones d'un liseré rouge. Sa ligne s'allume aussi dans la légende du poster.
  - Survoler le poster, y compris sa propre légende, désigne l'entrée sous le pointeur. Un clic ou un toucher fixe le choix ; Échap ou un clic hors zone le lève.
  - Sous le poster s'affichent le nom, le groupe et la surface de l'entrée choisie.
  - Sur ordinateur, le poster tient dans la hauteur de l'écran et reste en vue à côté de la liste. Sur tablette et mobile, il reste collé sous l'en-tête (55 % de la hauteur) au-dessus de la liste.
- **Carte d'étiquettes** :
  - `img/cadastre/cadastre-etiquettes.png` (1200 × 1697, 20 Ko) donne pour chaque point du poster l'entrée de la légende (niveau de gris = numéro × 10). Elle est lue par app.js à l'approche de la section.
  - Le PDF ne contenant que des images, elle vient d'une analyse des pixels : aplats de couleur, densité des traits de hachure diagonaux, blocs blancs fermés par des contours sombres. La chaîne est rangée dans `scripts/cadastre/` ; la marche à suivre pour une nouvelle édition est en tête de `outils.js`.
  - Contrôle : chaque entrée couvre de 9 à 10 pixels par km² de sa surface officielle. Les plus petits permis d'exploitation perdent une partie de leur bord : leur détourage reste approximatif à quelques pixels près.
- **Choix à valider avec le client** :
  - Le SVG schématique fourni avec le PDF n'a pas servi : sa géométrie est approximative et ses couleurs diffèrent du poster.
  - Dans la liste, « SNHG GOC » devient « SNHG » en français et « GOC » en anglais (règle de nommage), et « TOTAL ENERGY » devient « TotalEnergies ». Les autres noms suivent le poster.
  - Le sigle AET n'est pas développé : sa signification exacte est à confirmer.
  - Certaines pastilles de la légende du poster n'ont pas la teinte de la carte (Assala, KOREG et Petronas en exploration) : la liste reprend la légende telle quelle.
- **Nouvelle édition** : remplacer le PDF et les images, refaire la carte d'étiquettes (`scripts/cadastre/`), mettre à jour les surfaces de la liste.
- **WordPress** :
  - Le poster est un média (images et PDF).
  - La légende est un répéteur ACF (nom, groupe, couleur, hachure, surface, numéro dans la carte d'étiquettes), traduit par Polylang.
  - Le thème reprend le CSS et le script de la section.

## Carrières : fonctionnement (préfiguration de WordPress)

- **Rubrique** (26/10/2026, demande client) : « Carrières » est un menu de l'en-tête, à côté d'« Informations », avec trois liens : « Pourquoi rejoindre la SNHG » (`carrieres/index.html`), « Formulaire de souscription » (`carrieres/candidature.html`) et « GO’TALK » (`gotalk/index.html`, toujours en rouge). En anglais : « Careers », avec « Why join GOC », « Application form » et « GO’TALK ». Le pied de page a une colonne « Carrières ». Les pages de la rubrique ont une sous-navigation à ces trois liens, sauf GO’TALK, laissée telle quelle. Carrières ne figure plus dans le menu « Informations » ni dans les sous-navigations d'Actualités, de la Médiathèque et des articles ; la sous-navigation de Contact garde son lien vers Carrières.
- **Page « Pourquoi rejoindre la SNHG »** : `carrieres/index.html` (`en/careers/index.html`), créée le 24/10/2026 à la demande du client.
- **Contenu** : texte du client, mot pour mot. « Pourquoi nous rejoindre ? » et les 6 bonnes raisons, en accordéon numéroté (une seule raison ouverte à la fois, la première à l'arrivée, ouverture animée là où le navigateur sait animer la hauteur), puis une bande « Construisons ensemble l'avenir énergétique du Gabon. » avec le bouton « Déposer ma candidature ».
- **Page « Formulaire de souscription »** (26/10/2026) : `carrieres/candidature.html` (`en/careers/application.html`). Le formulaire de candidature spontanée, auparavant dans une fenêtre de la page Carrières, y est affiché en clair, dans la mise en page du Contact : à gauche, le dossier à préparer (CV et lettre, PDF ou DOCX, 3 fichiers et 5 Mo au maximum) ; à droite, le formulaire, avec les mêmes champs et les mêmes contrôles des pièces jointes. Le bouton « Déposer ma candidature » de la page Carrières y mène. Ouverture : la réunion d'équipe d'Obangué (`carrieres-equipe`), aussi utilisée dans la bande de candidature.
- **WordPress** : la page « Pourquoi rejoindre la SNHG » est composée des blocs Bannière, Détails (un par raison) et Couverture (la bande) ; la page « Formulaire de souscription » des blocs Bannière, Colonnes (texte et liste à gauche) et du formulaire de l'extension à droite.

## GO’TALK : fonctionnement (préfiguration de WordPress)

- **Page** : `gotalk/index.html` (`en/gotalk/index.html`), créée le 24/10/2026 à la demande du client. Depuis le 26/10/2026, troisième lien du menu « Carrières », toujours en rouge ; la page elle-même n'a pas changé.
- **Source unique** : `sources/gotalk.json` (traduction : `sources/en/gotalk.json`, par identifiant), mis en forme par `scripts/gotalk.js`. Chaque talent : nom, fonction, service, photo, titre, chapeau, entretien (question, accroche en gras facultative, réponse) et « En quelques mots » (libellé, texte). Textes : document « PORTRAIT MÉTIER » du client, mot pour mot ; les tirets cadratins y deviennent deux-points ou parenthèses, l'italique est gardée.
- **Mise en page** : une ouverture sombre (la marque en très grand, lettres qui montent, apostrophe rouge en bulle ; le propos dans une bulle de dialogue), puis une carte par talent : la photo, le nom et la fonction seulement. « Lire le portrait » apparaît au survol.
- **Portrait** : un clic ouvre une fenêtre de lecture. La photo de la carte s'agrandit jusqu'à la fenêtre (transition de vue, là où le navigateur la connaît). La photo et l'identité restent à gauche ; l'entretien défile à droite, en colonne de 42rem, avec un trait rouge d'avancement de la lecture. Les réponses fortes (« La responsabilité. ») sont mises en exergue, « En quelques mots » est en encadré. On passe au portrait précédent ou suivant sans fermer. Sur mobile, la fenêtre occupe l'écran, photo en tête. Chaque portrait a son adresse (`gotalk/index.html#axelle-manguiya-etoughe`), à partager.
- **Photos** : les 3 portraits fournis (dossier « our » du client, copiés dans « GOTALK »), recadrés en 4:5 (`gotalk-<id>`, 960 × 1200). Les noms des fichiers d'origine (« Portrait professionnel en bureau moderne », « … sur fond noir ») évoquent des images retouchées ou générées : à confirmer avec le client que ce sont bien les portraits validés des collaborateurs.
- **Noms** : Yannick ISSOUKOU BELEMLOUGRI (ingénieur chimiste de production, Mboumba) et Shandy NGOUNGOULOU (contrôleur de coûts senior), fournis par le client le 26/10/2026. Si un nom manque un jour, la carte affiche la fonction à sa place.
- **WordPress** : un type de contenu « Talent » (ACF : nom, fonction, service, photo, titre, chapeau, entretien en répéteur, « En quelques mots » en répéteur), traduit par Polylang ; la page liste les talents, le script du thème ouvre les portraits.

## Engagements HSEI et RSE : fonctionnement (préfiguration de WordPress)

- **Pages** : `engagements/hsei.html` et `engagements/rse.html`, dans le menu « Activités et engagements » (« Engagements HSEI », « Engagements RSE »). Les blocs HSSE et RSE de la page Activités et engagements y renvoient. Les deux pages renvoient l'une à l'autre.
- **Contenu** : les grandes lignes des deux documents du client (« Engaments HSEI.pdf » et « Nos engagements RSE .pdf », 20/10/2026). Chaque page présente l'approche, une carte par politique (devise, explication courte, engagements clés), puis une phrase de conclusion. La page HSEI ajoute les 10 Règles d'or, retranscrites en texte (les fautes de l'affiche, « vchute » et « dindividuel », sont corrigées).
- **Documents** : `documents/goc-engagements-hsei.pdf` (5 pages, 573 Ko) et `documents/goc-engagements-rse.pdf` (5 pages, 706 Ko). Ce sont les documents remis en forme par le client (« GOC_Nos-engagements-HSEI.pdf » et « GOC_Nos-engagements-RSE.pdf », 20/10/2026). Ils se lisent en ligne dans la liseuse PDF.js ou se téléchargent sous les noms `GOC-Engagements-HSEI.pdf` et `GOC-Engagements-RSE.pdf`, comme le rapport de la page Activités. Pour une nouvelle version, il suffit de déposer le PDF sous le même nom. Il faut ensuite mettre à jour le nombre de pages et le poids dans la carte et dans la liseuse, puis redessiner la couverture (`img/documents/goc-engagements-*-couverture.jpg`, première page en 480 px).
- **À corriger dans les PDF** (par le client, à la source) : le pied de chaque page (« Gabon Oil Company — Société Nationale des Hydrocarbures du Gabon ») et le titre enregistré dans les propriétés des fichiers contiennent un tiret cadratin.
- **Photos** : produites par `scripts/preparer-photos.js` (`hsei-hero`, `hsei-approche`, `rse-hero`, `rse-approche`) : un opérateur sous masque respiratoire, un point sécurité devant le tableau HSSE de Mboumba, le village de Mandji vu du ciel, deux opérateurs au bord du fleuve.
- **WordPress** : deux pages composées de blocs : Bannière, Média et texte, Colonnes de cartes, Groupe sombre pour les Règles d'or, Fichier pour le PDF. Le script du thème ajoute la liseuse.

## Formulaires : fonctionnement (préfiguration de WordPress)

- **Trois formulaires** : contact (`contact/index.html#formulaire`), candidature spontanée (page « Formulaire de souscription », `carrieres/candidature.html`, avec pièces jointes) et lettre d'information (page Actualités). Chacun a une case de consentement obligatoire qui renvoie à la politique de confidentialité.
- **Contrôles** : champs obligatoires vérifiés par le navigateur, état annoncé aux lecteurs d'écran. Pour la candidature : nom, e-mail, documents et consentement obligatoires (astérisque), PDF ou DOCX, 3 fichiers et 5 Mo par fichier au maximum. Le service d'envoi doit refaire ces contrôles de son côté.
- **Envoi** : `js/app.js` envoie le formulaire sans quitter la page vers l'adresse de son attribut `action`, puis affiche un message de confirmation ou d'erreur. Le bouton est bloqué pendant l'envoi.
- **À brancher** : aucun `action` n'est renseigné pour l'instant. Le formulaire le dit alors au visiteur (« rien n'a été transmis ») et donne l'adresse contact@gabonoil.com. Pour le relier, il faut renseigner `action="…"` dans `sources/pages/contact/index.html`, `sources/pages/carrieres/candidature.html` et `sources/pages/actualites/index.html` (et leurs pages anglaises) avec l'adresse fournie par le service retenu :
  - **contact** : Formspree, Web3Forms ou une fonction Vercel ;
  - **candidature** : un service qui accepte les pièces jointes (offres payantes chez Formspree et Web3Forms) ;
  - **lettre d'information** : l'adresse d'inscription de l'outil d'envoi (Brevo, Mailchimp…).
  Il faut un compte au nom de la SNHG et l'adresse de réception des messages.
- **WordPress** : une extension de formulaires (Contact Form 7, Fluent Forms…) et l'extension de l'outil d'envoi de la lettre prendront le relais, avec leurs propres protections contre les robots.

## Référencement et partage : fonctionnement (préfiguration de WordPress)

- **Balises** : chaque page a une adresse canonique (le dossier pour un `index.html` : `/activites/`, `/` pour l'accueil), les balises Open Graph (titre, description, image, adresse, type `article` pour les actualités) et `twitter:card`. Un lien partagé sur WhatsApp, LinkedIn, Facebook ou X s'affiche avec une image et un résumé.
- **Images d'aperçu** : 1200 × 630 px, dans `img/partage/`. `scripts/preparer-partage.js` les tire de la photo d'ouverture de chaque page (même point focal), ou de la photo à la une des articles. L'accueil et les pages sans photo propre prennent les opérateurs entre les réservoirs d'Obangué. Après l'ajout d'une page ou d'un article, il faut relancer ce script, puis régénérer les pages.
- **Plan du site et robots** : `sitemap.xml` (toutes les pages) et `robots.txt` (exploration ouverte, adresse du plan) sont écrits à la racine à chaque génération. Il reste à déclarer le plan du site dans Google Search Console.
- **Adresse du site** : `https://snhg-vert.vercel.app` (préproduction sur Vercel), dans `scripts/partage.js` (`ADRESSE_SITE`). Le nom de domaine définitif est `www.gaboil.com` (choix du client, 24/10/2026) : à la mise en ligne, mettre `https://www.gaboil.com` dans `ADRESSE_SITE`, puis régénérer les pages. Si la préproduction ne doit pas être indexée, il faut remplacer `Allow: /` par `Disallow: /` dans `robots()`.
- **WordPress** : une extension SEO (Yoast, Rank Math…) produit ces balises, le plan du site et `robots.txt`.

## Version anglaise : fonctionnement (préfiguration de WordPress)

- **Modèle** : celui de Polylang. Le français est la langue par défaut, à la racine du site ; l'anglais est sous `en/`, avec des adresses anglaises. Chaque page anglaise est liée à sa page française par la ligne `"fr": "…"` en tête de sa source (`sources/en/pages/`) : c'est la « traduction liée » de Polylang. Les deux versions ont la même structure (balises, classes, identifiants) ; seuls changent le texte, les adresses et les noms propres marqués `lang="fr"`.
- **Sélecteur FR | EN** : dans l'en-tête et le menu mobile. Il mène à la traduction de la page affichée, pas à l'accueil, en gardant la partie visée (`#vision-valeurs`) et la catégorie filtrée (`?categorie=filiales`) : les identifiants et les slugs de catégorie sont les mêmes dans les deux langues. La langue courante est signalée aux lecteurs d'écran, qui lisent aussi « français » et « English » en entier.
- **Adresses des pages** :

  | Page française | Page anglaise |
  |---|---|
  | `index.html` | `en/index.html` |
  | `groupe/presentation.html` | `en/group/about.html` |
  | `groupe/historique-gouvernance.html` | `en/group/history-governance.html` |
  | `filiales/index.html` | `en/subsidiaries/index.html` |
  | `activites/index.html` | `en/activities/index.html` |
  | `activites/exploration-production.html` | `en/activities/exploration-production.html` |
  | `activites/projets-strategiques.html` | `en/activities/strategic-projects.html` |
  | `engagements/hsei.html` | `en/commitments/hsei.html` |
  | `engagements/rse.html` | `en/commitments/csr.html` |
  | `actualites/index.html` | `en/news/index.html` |
  | `mediatheque/index.html` | `en/media-library/index.html` |
  | `contact/index.html` | `en/contact/index.html` |
  | `informations-legales/mentions-legales.html` | `en/legal/legal-notice.html` |
  | `informations-legales/confidentialite.html` | `en/legal/privacy-policy.html` |
  | `informations-legales/cookies.html` | `en/legal/cookies.html` |
  | `activites/distribution-transformation.html` | `en/activities/distribution-processing.html` |
  | `activites/services-petroliers.html` | `en/activities/oil-services.html` |
  | `activites/stations-gaboil.html` | `en/activities/gaboil-stations.html` |
  | `carrieres/index.html` | `en/careers/index.html` |
  | `carrieres/candidature.html` | `en/careers/application.html` |
  | `gotalk/index.html` | `en/gotalk/index.html` |

- **Adresses des articles** (`actualites/<slug>.html` devient `en/news/<slug anglais>.html`, champ `slug` de `sources/en/actualites.json`) : `nomination-dg-gaboil` → `gaboil-new-managing-director`, `deploiement-gaboil` → `gaboil-network-expansion`, `modernisation-outils` → `management-tools-modernisation`, `pizolub-renaissance` → `pizolub-industrial-revival`, `tullow-oil-gop` → `tullow-oil-gabon-becomes-gop`, `smp-maintenance` → `smp-maintenance-expertise`, `assala-energy` → `assala-energy-milestone`, `dinonga-irondu` → `dinonga-irondu-operator`, `retrocession-addax` → `addax-assets-transfer`, `dussafu-ezanga` → `dussafu-ezanga-stakes`, `perenco-participations-etat` → `perenco-state-interests`, `cepp-mboga-ii` → `mboga-ii-expansion`, `joint-venture-bourbon` → `bourbon-gabon-joint-venture`.
- **Données traduites** : `sources/en/actualites.json` (catégories, titres, extraits, contenus, textes alternatifs), `sources/en/diaporama-accueil.json` (sur-titres, titres, chapôs, boutons, repérés par l'`id` de chaque diapositive) et `sources/en/mediatheque.json` (types, titres, descriptions, légendes des photos, dans l'ordre du fichier français). Dates, images, durées et liens ne sont écrits qu'une fois, dans le fichier français.
- **Menus et libellés** : `sources/navigation.json` (un libellé par langue pour chaque entrée de menu) et `sources/libelles.json` (textes d'interface du gabarit et des pages générées). Les messages de `js/app.js` suivent la langue de la page (`<html lang>`).
- **Référencement** : chaque page a son adresse canonique dans sa langue, des liens `hreflang` vers les deux versions et `x-default` vers la version française, `og:locale` (`fr_FR` ou `en_GB`) et `og:locale:alternate`. Le plan du site liste les 68 adresses, les françaises d'abord.
- **Conventions de traduction** : anglais britannique (« programme », « organisation »), traduction faite d'après le texte français, sans reprendre de version existante. Les noms propres français (raison sociale de la SNHG, sociétés et organismes, adresses postales) restent en français et sont marqués `lang="fr"` pour être bien prononcés. Les PDF, en français, sont signalés « in French ». Les nombres suivent l'usage anglais (90,000, 5 MB). « ADG » devient « Managing Director ».
- **Pages juridiques** : une mention sous le sommaire précise que la version française fait foi en cas de divergence. La traduction des mentions légales, de la politique de confidentialité et de la page cookies est à faire valider par le service juridique.
- **Contrôles** : la génération s'arrête si une page, un article, un lien ou un champ n'a pas sa version anglaise. Les pages anglaises ont été passées au crible (textes visibles, textes alternatifs, `aria-label`, `title`, `placeholder`, métadonnées) : il n'y reste du français que dans les noms propres.
- **WordPress** :
  - **Polylang** (langue par défaut : français ; anglais dans un sous-dossier `/en/`) relie chaque page et chaque article à sa traduction.
  - **Menus** : un menu par langue, d'après `sources/navigation.json`.
  - **Textes du thème** : `sources/libelles.json` et les messages de `js/app.js` deviennent des chaînes traduisibles du thème (fichiers `.po`/`.mo`, ou traduction des chaînes dans Polylang).
  - **Catégories** : elles sont traduites dans Polylang. Polylang gratuit impose un slug différent par langue (`filiales` / `subsidiaries`). Le paramètre `?categorie=` de la maquette disparaît au profit des archives de catégorie.
  - **Référencement** : l'extension SEO, associée à Polylang, produit les `hreflang` et le plan du site multilingue.

## Suivi de l'audit du 20/10/2026 (BCOM)

Points critiques et hauts, traités le 20/10/2026 :

| Constat | Priorité | Traitement |
|---|---|---|
| Page « Projets stratégiques » en 404 | Critique | Page en ligne depuis l'envoi du 20/10/2026. Les 2 dernières pages manquantes, Distribution et transformation et Services pétroliers, ont été créées le 20/10/2026 (partie 1). |
| Sélecteur EN inactif | Critique | Version anglaise complète le 20/10/2026 : toutes les pages sont traduites et le sélecteur FR \| EN mène à la traduction de chaque page (voir « Version anglaise »). |
| Formulaires contact, lettre, candidature non branchés | Critique | Prêts à envoyer, avec messages de confirmation et d'erreur. Plus aucun message n'est perdu sans que le visiteur le sache. Reste à renseigner l'adresse du service d'envoi (voir « Formulaires »), qui demande un compte au nom de la SNHG. |
| Consentement absent | Haute | Case obligatoire sur les trois formulaires. La politique de confidentialité couvre désormais la lettre d'information. |
| robots.txt, sitemap.xml, Open Graph, canonical | Haute | Générés pour toutes les pages (voir « Référencement et partage »). |
| Vidéo d'accueil de 3,1 Mo | Haute | 0,79 Mo en WebM, 1,22 Mo en MP4, rien sur téléphone (voir « Diaporama d'accueil »). |
| En-têtes de sécurité | Moyenne | En place le 21/10/2026 (voir « En-têtes de sécurité » ci-dessous). |
| Textes alternatifs | Haute | Les 8 photos d'actualités sont décrites. Restent vides, à dessein (règle RGAA des images décoratives et des liens composites) : les fonds de bandeau, les logos et photos placés dans un lien qui affiche déjà le nom ou le titre (les décrire ferait lire le nom deux fois), les copies masquées du bandeau des filiales, les vignettes de la frise et les portraits à côté du nom. |

Points moyens encore ouverts : contrastes des gris et des étiquettes sur photo, zones cliquables de moins de 44 px, données structurées `Organization`, titre de l'onglet de l'accueil (76 caractères en français), description de l'article « nomination DG Gab'Oil ». Sont réglés : la règle de dénomination SNHG et GOC (arbitrée par le client le 23/10/2026, voir « Nom de la société ») et le bouton « haut de page » qui passait sur le texte (ci-dessous).

Bouton « haut de page » (24/10/2026, demande client) : une pastille blanche à flèche rouge de 44 px, qui passe au rouge au survol, au lieu du rond rouge de 48 px. À partir de 1 400 px de large, il est centré dans la marge de droite, hors du texte, et reste affiché une fois l'ouverture de page dépassée. En dessous, il n'apparaît qu'en remontant la page ou tout en bas, et s'efface dès qu'on redescend ; le pied de page lui réserve sa place pour qu'il ne couvre pas les derniers liens. Les articles, qui n'ont pas d'ouverture, l'ont aussi, passé le premier écran. Dans WordPress : même CSS et même script dans le thème.

Les mentions « Source : SNHG – Gabon Oil Company » sous les chiffres clés de l'accueil et de la page Distribution et transformation ont été retirées le 21/10/2026, à la demande du client, dans les deux langues.

## En-têtes de sécurité

Déclarés dans `vercel.json` pour toutes les adresses du site, et appliqués aussi par le serveur local (`scripts/serve.js`) : ce qui marche en local marche en ligne.

- **Content-Security-Policy** : scripts, styles, polices, images, vidéos et requêtes ne viennent que du site lui-même. Pas de cadre, pas d'objet, pas d'intégration du site dans une autre page. Le seul script en ligne (`document.documentElement.classList.add('js')`, dans `sources/gabarit.html`) est autorisé par son empreinte SHA-256. Les attributs `style` (point focal des photos) restent permis. La liseuse PDF.js tourne sans `eval` (`isEvalSupported: false`).
- **X-Frame-Options** `DENY`, **X-Content-Type-Options** `nosniff`, **Referrer-Policy** `strict-origin-when-cross-origin`, **Strict-Transport-Security** (2 ans, sous-domaines compris), **Permissions-Policy** (caméra, micro, géolocalisation, paiement, USB et suivi publicitaire coupés), **Cross-Origin-Opener-Policy** `same-origin`.
- **Contrôle à la génération** : `scripts/assembler-pages.js` s'arrête si une page contient un script en ligne dont l'empreinte n'est pas dans `script-src`, ou un attribut `onclick`, `onload`… Le message donne l'empreinte à ajouter.
- **À faire** :
  - Au branchement des formulaires, ajouter le domaine du service d'envoi à `connect-src` et `form-action`.
  - Matomo étant hébergé sur le serveur de la SNHG, il reste couvert par `'self'`. Un outil externe demanderait d'ajouter son domaine.
  - Vérifier la note du site en ligne sur securityheaders.com une fois le nom de domaine définitif en place.
- **Cache du navigateur** (21/10/2026) : par défaut, Vercel fait redemander chaque image au serveur à chaque page vue, et chaque mise en ligne vide son cache. Après un envoi, chaque photo mettait environ une demi-seconde à s'afficher. Désormais, chaque fichier appelé par une page porte l'empreinte de son contenu (`?ver=…`, ajoutée par `scripts/assembler-pages.js`), et ces adresses restent un an dans le navigateur (`Cache-Control: public, max-age=31536000, immutable`). Une page déjà vue s'affiche sans rien redemander, et un fichier modifié change d'adresse. En WordPress : passer l'empreinte ou la date du fichier comme version à `wp_enqueue_style` et `wp_enqueue_script`, et poser le même cache longue durée sur `/wp-content/uploads/` et le dossier du thème chez l'hébergeur.
- **WordPress** : poser les mêmes en-têtes chez l'hébergeur (configuration du serveur) ou par une extension. Réserver la politique de contenu aux pages publiques : l'administration et l'éditeur de blocs ont besoin de scripts en ligne et d'`eval`. Les scripts que WordPress ajoute dans les pages (`wp_add_inline_script`, emojis) sont à retirer ou à autoriser par empreinte ou par nonce.

Les parties suivantes font le point sur les pages, les photos, les textes à relire, les informations légales à fournir et ce qu'il faudra brancher dans WordPress.

## 1. Pages créées

| Page | Fichier | Écran Banani |
|---|---|---|
| Accueil | `index.html` | Accueil |
| Présentation du groupe | `groupe/presentation.html` | PresentationGroupe |
| Historique et gouvernance | `groupe/historique-gouvernance.html` | HistoriqueGouvernance |
| Filiales et entités | `filiales/index.html` | Filiales |
| Activités et engagements | `activites/index.html` | ActivitiesCommitments |
| Exploration et production | `activites/exploration-production.html` | ActivitiesExploration |
| Contact | `contact/index.html` | Contact |
| Mentions légales | `informations-legales/mentions-legales.html` | aucun : éléments Banani (sous-navigation, ouverture, étiquettes et encadré du Contact) |
| Politique de confidentialité | `informations-legales/confidentialite.html` | idem |
| Gestion des cookies | `informations-legales/cookies.html` | idem, avec un tableau des cookies et un interrupteur de refus de la mesure d'audience |
| Actualités (liste filtrable) | `actualites/index.html` | aucun : cartes d'actualité de l'accueil, sous-navigation, ouverture |
| Médiathèque (8 galeries, 49 photos) | `mediatheque/index.html` | aucun : sous-navigation, ouverture, pastilles des actualités, fenêtres des autres pages |
| Engagements HSEI | `engagements/hsei.html` | aucun : composants des pages Activités, Présentation et Exploration (ouverture, cartes, appel, carte du rapport) |
| Engagements RSE | `engagements/rse.html` | idem |
| Projets stratégiques | `activites/projets-strategiques.html` | aucun : composants des pages Exploration (ouverture, texte et photo, appel) et Engagements RSE (cartes numérotées) |
| Distribution et transformation | `activites/distribution-transformation.html` | aucun : composants des pages Exploration (ouverture, texte et photo, cartes, appel) et chiffres clés de l'accueil |
| Services pétroliers | `activites/services-petroliers.html` | aucun : composants des pages Exploration (ouverture, texte et photo, cartes, appel) et Engagements HSEI (cartes numérotées) |
| Stations Gab'Oil (carte et liste) | `activites/stations-gaboil.html` | aucun : ouverture, pastilles des actualités, cartes de la page |
| Pourquoi rejoindre la SNHG (Carrières) | `carrieres/index.html` | aucun : ouverture, bande « Cap vers 2030 » de l'accueil et accordéon numéroté |
| Formulaire de souscription (Carrières) | `carrieres/candidature.html` | ContactNoModal pour les champs du formulaire, mis en page comme le Contact |
| GO’TALK (portraits des talents) | `gotalk/index.html` | aucun : ouverture et fenêtre dessinées pour la page, cartes et pastilles du site |
| Articles (13 pages) | `actualites/<slug>.html` | aucun : en-tête éditorial, colonne de lecture, « À lire aussi » |

Rangement (20/10/2026, demande client) : l'accueil est à la racine du site, chaque autre page dans le dossier de sa rubrique (`groupe/`, `filiales/`, `activites/`, `engagements/`, `actualites/`, `mediatheque/`, `carrieres/`, `gotalk/`, `contact/`, `informations-legales/`), à côté de `css/`, `js/`, `img/`, `video/`, `documents/` et `fonts/`. Les anciennes adresses (`engagements-rse.html`, `actualite-<slug>.html`…) sont redirigées vers les nouvelles par `vercel.json`.

Chaque page et chaque article a sa traduction anglaise sous `en/` (voir « Version anglaise »), soit 68 pages en tout.

On modifie les sources dans `sources/pages/` (rangées comme le site) et `sources/en/pages/` pour l'anglais, ainsi que l'en-tête et le pied communs dans `sources/gabarit.html`, les menus dans `sources/navigation.json` et les textes d'interface dans `sources/libelles.json`. Les liens s'y écrivent depuis la racine du site ; la génération les rend relatifs à chaque page.
La commande `node scripts/assembler-pages.js` régénère toutes les pages. Avec `--surveiller`, la régénération se fait à chaque enregistrement.

## 2. Pages liées mais pas encore créées

Aucune depuis le 20/10/2026 : les pages Distribution et transformation et Services pétroliers sont créées, en français et en anglais. Elles figurent dans le menu « Activités et engagements », la sous-navigation des pages d'activité, les boutons d'appel et les cartes de la page Activités. Les ancres `#aval` et `#services-petroliers` de la page Activités restent en place pour les liens déjà partagés.

La page Publications (`publications.html`) n'est plus liée nulle part. Elle a été retirée du menu le 19/10/2026, à la demande du client, et le bouton « Consulter les rapports annuels » a été remplacé par la carte du rapport le 20/10/2026.

## 3. Pages présentes sur le site de référence, absentes de Banani (facultatives)

Pour l'instant, elles sont traitées comme des sections ou des ancres des pages existantes. Une page dédiée peut être créée plus tard.

| Sujet | Traitement actuel | Page dédiée possible |
|---|---|---|
| Chaque filiale (Assala, SMP, Pizolub, Gab'Oil, GOP) | Cartes avec ancres dans `filiales/index.html` | Une page par filiale, comme sur le site de référence |
| Exploration / Production séparées | Ancres `#exploration` et `#production` dans `activites/exploration-production.html` | Deux pages, comme sur le site de référence |

## 4. Photos

**Toutes les photos du site sont réelles depuis le 20/10/2026**, sous une réserve : les 3 portraits GO’TALK, à faire confirmer par le client (voir « GO’TALK »). Les visuels générés par IA ont été retirés : ceux de la maquette Banani, et ceux du site de référence SNHG, qui portent la marque Gemini (étoile à quatre branches dans le coin). Les remplaçantes viennent des reportages du client (« Opérations GOC », « Bureaux et staffs », « Station »). Elles sont choisies pour coller à l'idée de chaque section, puis recadrées par `scripts/preparer-photos.js` dans `img/photos/`, en 1536 et 768 px. Le cadrage fin des ouvertures se règle par un point focal sur l'image (`style="object-position: …"`), comme le point focal du bloc Bannière de WordPress.

| Page et section | Fichier (`img/photos/`) | Photo du client |
|---|---|---|
| Accueil, diapositive 2 « 15 ans d'expertise » | `accueil-expertise` | Deux opérateurs entre les réservoirs, Obangué |
| Accueil, « Qui sommes-nous » | `accueil-qui-sommes-nous` (portrait) | Opérateur GOC, bras croisés, sur site |
| Accueil, cartes Exploration, Production, Projets stratégiques | `accueil-exploration`, `accueil-production`, `accueil-projets` | Tour de forage (Sardine), opérateur à la vanne, nouvelle installation vue du ciel (Mandji) |
| Accueil, « Bâtir un avenir énergétique responsable » | `accueil-engagements` | Réunion sécurité HSSE, Mboumba |
| Accueil, « Cap vers 2030 » | `accueil-cap-2030` | Champ de Tsiengui dans la forêt, vue aérienne |
| Présentation : ouverture, Le mot de l'ADG, Vision | `presentation-hero`, `presentation-adg` (portrait), `presentation-vision` | Opérateur devant les drapeaux (Mboumba), portrait officiel de l'ADG (dossier « CA »), une opératrice montre l'horizon à son collègue (Obangué) |
| Historique et gouvernance | `historique-hero` | Opérateur GOC face aux drapeaux du Gabon, Mboumba |
| Filiales | `filiales-hero` | Station Gab'Oil |
| Activités et engagements | `activites-hero` | Opérateur devant les réservoirs, Tsiengui |
| Exploration et production : ouverture, section amont | `exploration-hero`, `exploration-salle-controle` | Opérateur aux têtes de puits (Sardine), salle de contrôle de Tsiengui |
| Contact | `contact-hero` | Collaborateur au service d'une collègue, bureaux de Port-Gentil |
| Actualités | `actualites-hero` (bandeau 2400 × 1030) | Perroquet gris du Gabon en vol, visuel fourni par le client le 26/10/2026 (dossier « Bannières »), gardé entier ; point focal à 85 % pour le mobile |
| Mentions légales, Confidentialité | `mentions-legales-hero`, `confidentialite-hero` | Bureaux de Port-Gentil |
| Projets stratégiques : ouverture, actions prioritaires | `projets-hero`, `projets-equipe` | Champ de Tsiengui et ses réservoirs en forêt, vue aérienne ; opérateurs en discussion sur la plateforme Sardine |
| Gestion des cookies | `cookies-hero` | Collaborateur à son poste informatique, bureaux de Libreville |
| Distribution et transformation : ouverture, section distribution | `actu-gaboil-station` (repris de l'article), `distribution-station` | Les deux photos d'inauguration de stations Gab'Oil du dossier « Station », les seules fournies : la première illustre aussi l'article sur le déploiement de Gab'Oil, la seconde l'ouverture de la page Filiales (ici recadrée sur la pompe et la boutique). La section Pizolub reprend la photo de l'usine du site SNHG (`img/actu-pizolub.jpg`, 758 px de large seulement). Des photos des stations, des dépôts et de l'usine Pizolub sont à demander au client. |
| Services pétroliers : ouverture, section SMP | `services-hero`, `services-intervention` | Technicien devant une armoire électrique (plateforme Sardine), technicien SMP sur un appareil de forage, main levée (photo fournie par le client le 24/10/2026, « SMP/SMP.webp »). Ce sont des photos des sites de la GOC, pas des équipes SMP : des photos de SMP au travail sont à demander au client. |
| Stations Gab'Oil | `stations-hero` | Station Gab'Oil de Makokou le jour de l'inauguration (titre incrusté retiré) |
| Carrières : ouverture, « Rejoindre la SNHG », bande de candidature (aussi ouverture du Formulaire de souscription) | `carrieres-hero`, `carrieres-fierte`, `carrieres-equipe` | Une collaboratrice et un collègue à leur poste, bureaux de Port-Gentil ; deux collègues en chemise SNHG relisent un document, bureaux de Port-Gentil (choisie par le client le 26/10/2026, à la place de l'opérateur casqué de Tsiengui) ; réunion d'équipe en tenue, Obangué |
| GO’TALK | `gotalk-axelle-manguiya-etoughe`, `gotalk-ingenieur-chimiste-mboumba`, `gotalk-controleur-couts-senior` (960 × 1200) | Portraits fournis avec le document « PORTRAIT MÉTIER » (24/10/2026) |
| Articles Addax, SMP, GOP, Gab'Oil | `actu-addax-tsiengui`, `actu-addax-obangue`, `actu-smp`, `actu-gop`, `actu-gaboil-station` | Champs repris de Tsiengui et d'Obangué, opérateur en salle électrique, réunion à Libreville, inauguration d'une station Gab'Oil (titre incrusté retiré) |

Les autres photos d'actualité (nominations, Assala, Pizolub, modernisation) viennent du site SNHG et ne portent pas de marque d'IA. La photo de « La SNHG en chiffres » est celle de la cérémonie de signature du rachat d'Assala (`img/accueil/assala-signature.jpg`, recadrée sur les quatre personnes). Les portraits du conseil d'administration et du comité de direction (`img/gouvernance/`) sont les vraies photos SNHG, recadrées en 160 px.

**Frise des dates clés (Historique)** : 13 vignettes illustrées en SVG dans `img/frise/`, générées par `scripts/creer-vignettes-frise.js`. Ce sont des dessins, pas des photos. Ils sont à garder tels quels ou à remplacer par des photos d'archives : il suffit de changer le `src` dans `sources/pages/historique-gouvernance.html`.

## 5. Textes recomposés à relire

Les textes viennent de snhg.vercel.app, mot pour mot quand c'était possible. Là où Banani demandait plus d'éléments que le site n'en fournit, j'ai assemblé des phrases du site :

- **Nom de la société** (règle du client, 23/10/2026). L'accueil français présente « la Société Nationale des Hydrocarbures du Gabon (SNHG), dite Gabon Oil Company (GOC) » ; le reste du site français dit « SNHG ». La version anglaise dit « Gabon Oil Company (GOC) » à la première mention, puis « GOC », et ses titres d'onglet finissent par « · Gabon Oil Company ». Trois exceptions gardent « SNHG » en anglais : le titre du dossier de presse (document en français) et le nom de son fichier, et les mentions légales, qui donnent la raison sociale (« Gabon Oil Company (GOC), the trade name of the Société Nationale des Hydrocarbures du Gabon (SNHG) »). Les vignettes de la frise qui portent le nom ont une version anglaise dans `img/frise/en/` (`scripts/creer-vignettes-frise.js`). Une actualité peut donner son illustration traduite (`image.src` dans `sources/en/actualites.json`), comme une image traduite dans Polylang.
- **Présentation, Le mot de l'ADG** (20/10/2026) : la section « Qui sommes-nous ? » devient le message de l'ADG, texte fourni par le client et signé Marcellin SIMBA NGABI, avec son portrait. Le menu « À propos » y mène toujours (ancre `#a-propos`). Depuis le 23/10/2026 (demande client), le message est en gris italique (contraste 6,1:1) et justifié, avec césure automatique sur mobile pour éviter les grands blancs. La fonction est en rouge sous le nom. Le même jour, la valeur « Respect » est corrigée : « considération dues à la personne ». L'italique est la vraie italique d'Archivo (`fonts/archivo-*-italique.woff2`), chargée seulement par cette page.
- **Projets stratégiques** (20/10/2026) : les 8 projets, l'introduction et « Horizon 2026 » sont repris mot pour mot de snhg.vercel.app/fr/activites/projets. Sont nouveaux : le titre et le chapeau d'ouverture, le texte d'introduction de la grille, et les 3 axes qui regroupent les projets (Accroître la production, Renouveler les réserves, Moderniser les infrastructures), avec leur phrase.
- **Pictogrammes des cartes numérotées** (Engagements RSE et HSEI, Projets stratégiques), 20/10/2026 : ils reprennent le modèle des cartes Missions (pastille rosée, trait rouge), à la demande du client. Les variantes de couleur bleue, verte, orange et violette des cartes sont retirées : tout est dans le rouge de la charte.
- **Distribution et transformation** (20/10/2026) : textes tirés de snhg.vercel.app (« Nos activités », filiales, actualités Gab'Oil et Pizolub). Les chiffres clés sont à valider : 7 stations en 2023, 13 stations actives (article de mai 2026 ; 12 dans l'article, porté à 13 le 23/10/2026 à la demande du client), 27 visées, 2 filiales dans l'aval. Les titres, le chapeau d'ouverture et les 3 cartes « Nos priorités » sont recomposés à partir de ces textes.
- **Services pétroliers** (20/10/2026) : textes tirés de snhg.vercel.app (« Nos activités », fiche SMP, actualité SMP). Les descriptions des 3 domaines d'intervention (mécanique et maintenance industrielle, instrumentation et électricité, forage et assistance technique) et les 4 cartes « Ce que change l'internalisation » développent ces textes et sont à faire valider par SMP. Nom de la filiale arrêté par le client le 21/10/2026 : « SMP – Société de Maintenance Pétrolière » partout sur le site (« SMP Afrique », du site de référence et du visuel « One group », n'est plus employé).
- **Présentation, missions** : les 4 cartes reprennent les missions SNHG. La 4e, sur la transition énergétique, est reformulée.
- **Activités, engagements** : les 4 thèmes (Environnement, RSE, Gouvernance, HSSE) ont chacun 4 puces tirées des phrases du site.
- **Activités et Exploration, encadrés d'appel** : titres et phrases de conclusion recomposés.
- **Exploration, points forts** : 4 chiffres (27 000 b/j, 90 000 b/j, Dinonga/Irondou, participations CEPP) à faire valider. Le 23/10/2026, le client a fourni le texte définitif : la liste des permis opérés (offshore Ayol, Konzi Sardine, Olowui ; onshore Akondo, Mboga II, Dinonga Irondou, Remboué) et des opérateurs partenaires (ASSALA, BWE, Maurel & Prom, Perenco, TotalEnergies EP Gabon). Le texte client écrit « Iroundou » ; le site garde « Irondou », l'orthographe demandée juste avant.
- **Historique, frise** : 13 dates, de 2011 à « Cap vers 2030 », à vérifier. Depuis le 23/10/2026 (demande client), la version française nomme la société « Société Nationale des Hydrocarbures du Gabon (SNHG) » dès 2011, et non plus GOC (titre, texte et vignettes 2011 et 2014). Les années et les dates citées dans le texte (balises `<time>`) sont en rouge (`--rouge-action`). Le permis s'écrit « Irondou » partout ; les adresses des articles gardent `dinonga-irondu` pour ne pas casser les liens.
- **Gouvernance, portraits du Conseil d'Administration** (23/10/2026) : les 7 photos (président et 6 administrateurs) sont remplacées par les portraits officiels du client (dossier « Photo CA »), associés par nom et recadrés sur le visage par `scripts/preparer-images.sh`. Les avatars du Conseil sont agrandis : 5 rem pour le président, 4,5 rem pour les administrateurs. Marcellin SIMBA NGABI a le même nouveau portrait dans la carte ADG du Comité de Direction.
- **Gouvernance, Comité de Direction** (23/10/2026) : la composition et les portraits suivent le dossier « CoDIR » du client, et les avatars ont les dimensions de ceux du Conseil (5 rem pour l'ADG et le DGA, 4,5 rem pour les directeurs).
  - **Ajouté** : Vladimir MEYOUA, Directeur Contrats & Achats, placé après le Directeur Juridique & Commercial.
  - **Retiré** : Emery LEPO, Directeur Business & Associations, sans photo dans le dossier.
  - **Noms et fonctions repris des fichiers du client** : Christian Joly YOGOULOU (et non JOLY YOGOULOU), Wilfrid Davy ONDAGUI ANTCHOUO et Guyllain OWONO SIMBA (au lieu des formes abrégées), Directeur Technique et Directeur Administratif « par intérim ».
  - **Inchangé** : Hervé Bertrand NNANG ENGUE garde son deuxième prénom, que le fichier omet. Le nom de l'administrateur est corrigé en « Fernand NGOUSSI MAYANGAH » (confirmé par le client ; le site de référence écrivait « MAYANGUI »).
- **Gouvernance** : les deux ministères de tutelle tiennent la place du haut de l'organigramme Banani. L'administrateur directeur général figure dans le comité de direction.
- **Filiales** (refaite le 21/10/2026 d'après le visuel « One group. One integrated energy value chain. » du stand du groupe) :
  - **Chaîne de valeur** : le titre « Un groupe. Une chaîne de valeur énergétique intégrée. », puis 4 maillons reliés par un trait rouge, avec les pictogrammes, les intitulés et le classement des entités du visuel. Amont : Gabon Oil Company, Assala Energy, Gabon Oil Participations. Services pétroliers amont : SMP – Société de Maintenance Pétrolière (« SMP Afrique » sur le visuel). Intermédiaire : Gab'Oil, Gabon Oil Company. Aval : Gab'Oil, Pizolub.
  - **Traduction des intitulés** : Upstream devient Amont, Upstream Oilfield Services devient Services pétroliers amont, Midstream devient Intermédiaire, Downstream devient Aval. La page anglaise garde les intitulés du visuel.
  - **Pictogrammes** : redessinés en SVG d'après le visuel (`PICTOGRAMMES` dans `scripts/assembler-pages.js`).
  - **Fiches des entités** : une seule par entité, dans l'ordre de la chaîne. Une étiquette donne le ou les secteurs de chacune (GOC : Amont · Intermédiaire ; Gab'Oil : Intermédiaire · Aval). Chaque nom de la chaîne mène à sa fiche. La carte GOP renvoie vers l'historique, faute de site officiel. Depuis le 24/10/2026 (demande client), les fiches forment un organigramme : la carte de Gabon Oil Company, entité mère, est en tête, et les 5 filiales sont dessous, reliées par des traits rouges comme l'organigramme de la gouvernance. Le design des cartes ne change pas. La disposition suit la largeur du cadre (requêtes de conteneur) : une rangée de 5 sous un trait commun (cadre de 75rem et plus), deux colonnes autour d'un tronc central, ou une colonne le long d'un tronc à gauche (moins de 40rem). Dans WordPress : un groupe pour la carte mère, puis une liste de cartes.
  - **WordPress** : la chaîne devient un bloc à liste répétable (pictogramme, secteur, entités liées), et les fiches un bloc de cartes (logo, secteurs, texte, lien).
  - **Logo Gab'Oil** (23/10/2026) : remplacé par le logo vectoriel remis par le client (`img/filiales/gab-oil.svg`), dans la fiche et dans la bande « Nos filiales » de l'accueil. L'ancien, tiré du site SNHG, était en réalité le logo de Gabon Oil Company.
- **Contact** : la section « Bureaux régionaux » de Banani est retirée, à la demande du client. Le champ « Sujet » est une saisie libre. Depuis le 24/10/2026, un champ « Téléphone » facultatif suit l'adresse e-mail : la politique de confidentialité le mentionnait déjà. Depuis le 24/10/2026, la page donne aussi le siège de Port-Gentil (« Gabon Oil Company, Immeuble Paquebot, entrée Nouveau Port, Port-Gentil », texte du client), sans téléphone tant que le numéro n'est pas fourni.
- **Menu principal** (24/10/2026, demandes client) : le menu « Information et contact » devient « Informations » (« Information » en anglais) et perd son lien Contact, aussi retiré des sous-navigations de ses pages. « Contact » est un onglet de l'en-tête, à côté des quatre menus (dont « Carrières » depuis le 26/10/2026, où GO’TALK est passé en rouge), et une ligne du menu mobile ; il ferme la colonne « Informations » du pied de page (`directs_au_pied`). Les liens FR | EN sont en rouge. C'est un lien direct, sans sous-menu (`directs` dans `sources/navigation.json` ; `mise_en_avant` met un onglet ou un lien de sous-menu en rouge ; dans WordPress, un élément de menu sans enfant, et une classe CSS pour le rouge). Le bouton rouge « Contact » de l'en-tête et du menu mobile est retiré. Sur la page Contact, c'est cet onglet qui est souligné.
- **Gouvernance** : Marcellin SIMBA NGABI figure aussi parmi les administrateurs du conseil (en premier, comme sur le site de référence), en plus de son rôle d'ADG au comité de direction.
- **Pages légales** : textes du site de référence mot pour mot. Seuls les chapeaux d'ouverture et la date de mise à jour sont nouveaux.
- **Politique de confidentialité, lettre d'information** (20/10/2026, audit) : ajout de la lettre aux données collectées, aux usages (avec lien de désinscription) et à la conservation (jusqu'à la désinscription), et d'une phrase sur le prestataire technique d'envoi. À valider par le service juridique.
- **Formulaires** (20/10/2026, audit) : textes des cases de consentement et des messages de confirmation, et mention des champs obligatoires de la candidature.
- **Gestion des cookies** : page rédigée à neuf (le site de référence n'en avait pas), d'après les choix conseillés le 20/10/2026 : aucun cookie publicitaire ni de réseau social, mesure d'audience Matomo dispensée de consentement, donc pas de bandeau. La politique de confidentialité renvoie désormais vers cette page.

## 5 bis. Informations légales à fournir avant la mise en ligne

Depuis le 24/10/2026, plus aucun champ des mentions légales n'est surligné en jaune : adresse du site, hébergeur et concepteur sont renseignés (section 4 « Conception et réalisation » ajoutée, sommaire renuméroté). Restent les points ci-dessous.

- **Adresse du site** : `www.gaboil.com` (choix du client, 24/10/2026), inscrite dans les mentions légales en français et en anglais. **À vérifier avant la mise en ligne** : ce domaine a été enregistré le 21/10/2026 chez Namecheap et affichait, le 24/10/2026, un site indonésien sans rapport avec la SNHG. Le client doit confirmer qu'il en a la maîtrise (accès au compte Namecheap et à ses réglages DNS). La messagerie reste sur `gabonoil.com` (domaine de 2000, Microsoft 365) : au changement d'hébergeur, ne pas toucher à ses réglages.
- **Hébergeur** : les mentions légales indiquent OVH SAS (OVHcloud), 2 rue Kellermann, 59100 Roubaix, France, www.ovhcloud.com : c'est l'hébergeur conseillé le 24/10/2026, en hébergement web à ressources garanties (gamme Performance), avec Cloudflare gratuit devant le site (son cookie technique sera à ajouter à la page Cookies). Si le client en retient un autre, changer la fiche « Hébergement du site » des deux pages (FR et EN).
- **Conception et réalisation** (24/10/2026, demande client) : Bamboo Communication (B-COM), agence de Libreville, téléphone +241 60 12 15 02 (ligne principale donnée par le site de l'agence et l'annuaire Le Pratique du Gabon), https://b-com.pro, dans une nouvelle section des mentions légales (FR et EN).
- **À valider par le service juridique** : faut-il ajouter le numéro RCCM, le NIF et le capital social de la SNHG ? Faut-il citer la loi gabonaise sur la protection des données personnelles et le recours auprès de l'autorité de contrôle (CNPDCP) ?
- **Siège de Port-Gentil** : numéro de téléphone (à ajouter dans les deux pages Contact, en lien `tel:`).
- **Cookies** : le tableau de `informations-legales/cookies.html` décrit la configuration conseillée (langue par Polylang, Matomo installé avec le site). Il faut l'ajuster aux extensions réellement installées : noms et durées des cookies, et tout cookie ajouté par l'hébergeur ou un pare-feu (Cloudflare, par exemple). La page cite déjà la CNPDCP.

## 6. À brancher lors de la phase 4 (thème WordPress)

- **Formulaires** : contact, candidature et lettre d'information sont prêts à envoyer, mais aucun service n'est encore relié (voir « Formulaires : fonctionnement »).
- **Mesure d'audience** : installer Matomo (extension Matomo for WordPress) avec les adresses IP anonymisées et les réglages de dispense de consentement. L'interrupteur de la page Cookies le pilote déjà par `_paq` (`optUserOut`, `forgetUserOptOut`). Dans la maquette, sans Matomo, il pose lui-même le cookie de refus.
- **Newsletter** : présente sur le site de référence, absente de Banani. Elle figure sur la page Actualités, à relier à l'outil d'envoi retenu.
- **Réseaux sociaux** : liens du pied de page arrêtés par le client le 24/10/2026 : Facebook (https://www.facebook.com/GabOilSA, la page de Gab'Oil SA) et LinkedIn (https://www.linkedin.com/company/gabon-oil). YouTube est retiré. X garde son icône avec un lien d'attente (« # ») à la demande du client : l'adresse fournie (x.com/gabonoilcomp) répond « Ce compte n'existe pas » (vérifié le 24/10/2026). Le bon lien est à fournir (application X : Profil, Partager, Copier le lien) ; il s'ouvrira alors dans un nouvel onglet, comme les autres. Audit des liens du 24/10/2026 : aucun lien interne ni aucune ancre cassés, aucun lien vide (hors le lien d'attente de X) ; le lien LinkedIn de la fiche Gab'Oil (page Filiales) menait à une page disparue (`gaboil-sa`), il mène maintenant à `gab-oil-sa`. Dans WordPress : le menu « Réseaux sociaux » du thème.
