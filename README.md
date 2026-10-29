# Site web Gabon Oil Company (SNHG)

Maquette HTML, CSS et JavaScript du site institutionnel de la Société nationale des hydrocarbures du Gabon (SNHG), Gabon Oil Company, en français et en anglais. Elle préfigure le futur thème WordPress : les contenus appelés à être gérés dans l'administration (actualités, diaporama d'accueil, galeries de la médiathèque, rapport PDF) sont déjà séparés de la mise en page, et chaque page française est reliée à sa traduction comme le fera Polylang.

## Structure

Le site est à la racine du dépôt, comme sur un hébergement classique : `index.html` est la page d'accueil, et les autres dossiers se trouvent à côté.

| Emplacement | Contenu |
|---|---|
| `index.html` | La page d'accueil |
| `groupe/` | Présentation du groupe (`presentation.html`), Historique et gouvernance (`historique-gouvernance.html`) |
| `filiales/` | Filiales et entités (`index.html`) |
| `activites/` | Activités et engagements (`index.html`), Exploration et production, Distribution et transformation, Services pétroliers, Projets stratégiques |
| `engagements/` | Engagements HSEI (`hsei.html`) et RSE (`rse.html`) |
| `actualites/` | Liste des actualités (`index.html`) et une page par article (`<slug>.html`) |
| `mediatheque/`, `contact/` | Médiathèque et Contact (`index.html`) |
| `informations-legales/` | Mentions légales, politique de confidentialité, gestion des cookies |
| `en/` | Version anglaise, rangée de la même façon avec des adresses anglaises : `en/index.html`, `en/group/`, `en/subsidiaries/`, `en/activities/`, `en/commitments/`, `en/news/`, `en/media-library/`, `en/contact/`, `en/legal/` |
| `css/` | Feuilles de style : `styles.css` (commun) et `pages.css` (pages intérieures) |
| `js/` | Scripts : `app.js`, et PDF.js dans `js/pdfjs/` pour la liseuse |
| `img/` | Images : photos réelles (`img/photos/`), médiathèque, gouvernance, filiales, frise, actualités, logos |
| `video/` | Vidéos du diaporama d'accueil |
| `documents/` | Documents PDF à lire en ligne ou à télécharger |
| `fonts/` | Police Archivo, hébergée avec le site |
| `favicon.ico` | Icône de l'onglet |
| `sitemap.xml`, `robots.txt` | Plan du site et consignes aux robots d'indexation, générés avec les pages |
| `sources/` | Outil de travail, pas en ligne : gabarit commun, menus, libellés d'interface, contenu de chaque page, données des actualités, du diaporama et de la médiathèque, et leurs traductions (`sources/en/`) |
| `scripts/` | Outil de travail, pas en ligne : génération des pages, serveur local, préparation des médias |
| `INVENTAIRE.md` | État du site : pages créées, pages à créer, photos à remplacer, textes à relire, points WordPress |

## Consulter le site

```bash
node scripts/serve.js
```

Le site est alors visible sur http://127.0.0.1:4321, et la page se recharge à chaque modification. Il ne faut aucune dépendance, seulement Node.js 20 ou plus récent. Le serveur ne sert que le site : `sources/`, `scripts/`, `references/`, les fichiers `.md` et les dossiers cachés restent inaccessibles.

La version en ligne est publiée par Vercel à chaque envoi sur GitHub : https://snhg-vert.vercel.app. Vercel publie la racine du dépôt, et le fichier `.vercelignore` en écarte les outils de travail (`sources/`, `scripts/`, `references/`, les fichiers `.md`).

Tout serveur statique pointé sur la racine du dépôt convient aussi, à condition qu'il accepte les requêtes partielles (en-tête `Range`), ce qui est le cas d'Apache et de Nginx. Les vidéos de l'accueil et la liseuse PDF en ont besoin. Ouvrir les fichiers directement depuis le disque ne suffit pas : la liseuse PDF ne fonctionnerait pas.

## Modifier le site

Les 60 pages HTML (30 en français, 30 en anglais) sont générées : on ne les modifie jamais à la main.

1. Modifier les sources :
   - `sources/gabarit.html` pour l'en-tête, le sélecteur de langue et le pied de page, communs aux deux langues ;
   - `sources/navigation.json` pour les menus (en-tête, menu mobile, plan du pied de page, liens légaux), avec leur libellé dans chaque langue ;
   - `sources/libelles.json` pour les textes d'interface du gabarit et des pages générées (« Lire la suite », mois, « min de lecture »…), dans chaque langue ;
   - `sources/pages/` pour le contenu de chaque page française, rangé comme le site (`sources/pages/activites/projets-strategiques.html` donne `activites/projets-strategiques.html`). Les liens et chemins s'y écrivent depuis la racine du site (`engagements/rse.html`, `img/photos/…`) : la génération les rend relatifs à chaque page ;
   - `sources/en/pages/` pour la traduction de chaque page, rangée comme la version anglaise (`sources/en/pages/activities/strategic-projects.html` donne `en/activities/strategic-projects.html`). Le commentaire de tête désigne la page française traduite (`"fr": "activites/projets-strategiques.html"`) ;
   - `sources/actualites.json` pour les articles (l'accueil affiche les 3 plus récents, la page Actualités les 20 plus récents) ;
   - `sources/diaporama-accueil.json` pour les diapositives de l'accueil ;
   - `sources/mediatheque.json` pour les galeries de la médiathèque (titre, texte, photos et leurs légendes) ;
   - `sources/en/actualites.json`, `sources/en/diaporama-accueil.json` et `sources/en/mediatheque.json` pour la traduction de ces données : seuls les champs à traduire y figurent (titres, textes, légendes, adresse anglaise des articles), le reste (dates, images, liens, durées) vient du fichier français.
2. Régénérer les pages :

   ```bash
   node scripts/assembler-pages.js              # une fois
   node scripts/assembler-pages.js --surveiller # à chaque enregistrement
   ```

La génération s'arrête si une page, un article ou un lien n'a pas sa version anglaise, ou si un champ à traduire manque. Pendant une traduction en cours, `TRADUCTION_PARTIELLE=1 node scripts/assembler-pages.js` en fait un simple avertissement. Dans une page anglaise, les liens peuvent s'écrire avec l'adresse française ou anglaise : ils mènent toujours à la version anglaise, ancre et paramètres compris.

La mise en page des articles est dans `scripts/actualites.js`, celle du diaporama dans `scripts/diaporama.js`, celle des galeries dans `scripts/mediatheque.js`. Les messages écrits par `js/app.js` (boutons pause, formulaires, filtre des actualités, liseuse) suivent la langue de la page.

Le référencement est dans `scripts/partage.js` : adresse canonique, liens `hreflang` vers la traduction et balises Open Graph de chaque page, `sitemap.xml` et `robots.txt`. L'adresse publique du site (`ADRESSE_SITE`) y est notée une seule fois : elle est à changer au passage sur le nom de domaine définitif.

Les en-têtes de sécurité (politique de contenu, protection contre l'intégration dans un cadre, HTTPS imposé…) sont dans `vercel.json`. `scripts/serve.js` les applique aussi en local, et la génération s'arrête si une page contient un script en ligne non autorisé. Le détail est dans `INVENTAIRE.md`.

Chaque image, vidéo, PDF, feuille de style ou script appelé par une page porte l'empreinte de son contenu (`img/photos/accueil.jpg?ver=3fa9c1d2e4`), et `vercel.json` laisse le navigateur garder ces fichiers un an sans les redemander. Un fichier modifié change d'empreinte : il faut donc régénérer les pages après avoir changé une image, un style ou un script, avant de les mettre en ligne. La surveillance (`--surveiller`) le fait d'elle-même.

Les formulaires (contact, candidature, lettre d'information) s'envoient vers l'adresse de leur attribut `action`, à renseigner dans les sources avec celle du service d'envoi retenu. Sans adresse, ils préviennent le visiteur que rien n'a été transmis. Le détail est dans `INVENTAIRE.md`.

## Médias

Les images, vidéos, documents et polices du site sont déjà préparés dans `img/`, `video/`, `documents/` et `fonts/`. Les scripts ci-dessous ont servi à les produire :

- `scripts/creer-vignettes-frise.js` : vignettes SVG de la frise historique. Il est autonome.
- `scripts/telecharger-police.js` : police Archivo, depuis Google Fonts.
- `scripts/preparer-photos.js` : photos réelles des pages (ouvertures, accueil, sections illustrées, actualités dont les photos d'origine étaient générées par IA), dans `img/photos/`. Il lit les reportages du client, hors du dépôt (dossier modifiable par la variable `PHOTOS_SOURCE`). Le choix et le recadrage de chaque photo sont listés en tête du script. Il faut `ffmpeg`.
- `scripts/preparer-partage.js` : images d'aperçu des liens partagés (1200 × 630 px, dans `img/partage/`), tirées de la photo d'ouverture de chaque page et de la photo à la une des articles. On le relance après l'ajout d'une page ou d'un article, puis on régénère les pages. Il faut `ffmpeg`.
- `scripts/preparer-images.sh` et `scripts/preparer-logos-filiales.js` : photos des actualités, vidéos (WebM et MP4 de moins de 1,5 Mo, réencodés depuis le 1080p du client), portraits et logos. Ils lisent les fichiers d'origine du client et du site de référence, qui ne sont pas dans ce dépôt pour ne pas l'alourdir. Il faut `ffmpeg`.
- `scripts/preparer-mediatheque.js` : photos de la médiathèque (vignettes de 800 px, grandes images de 1 600 px), d'après `sources/mediatheque.json`. Il lit le reportage « Opérations GOC » du client, hors du dépôt (dossier modifiable par la variable `MEDIATHEQUE_SOURCE`). Il faut `ffmpeg`. Après l'ajout d'une photo dans le fichier de données, on le relance, puis on régénère les pages.

## Version WordPress

Le thème WordPress `snhg` reprend la maquette telle quelle : mêmes styles, même script, même balisage. On le construit depuis les mêmes sources que le site statique. Il demande les extensions Secure Custom Fields (champs) et Polylang (français à la racine, anglais sous `/en/`).

- `wordpress/snhg/` : gabarits PHP du thème. Le rôle de chaque fichier est décrit en tête de `functions.php`.
- `node scripts/wordpress/construire.js [dossier du WordPress]` copie le thème et les fichiers du site dans `wp-content/themes/snhg/`. Il prépare aussi les contenus à importer dans `wp-content/uploads/snhg-import/contenus.json`.
- `C:/xampp/php/php.exe scripts/wordpress/importer.php [dossier du WordPress] theme` active le thème et crée les langues. C'est à faire une fois.
- La même commande avec `contenus` au lieu de `theme` importe les contenus :
  - médias ;
  - pages (blocs « HTML personnalisé ») ;
  - articles ;
  - diapositives de l'accueil, stations Gab'Oil, galeries de la médiathèque et portraits GO’TALK (types de contenus à champs) ;
  - menus et réglages.

  Un nouvel import met à jour les mêmes contenus. Il remplace donc ce qui a été modifié dans l'administration.

Les repères des modèles deviennent des codes courts rendus par le thème : `[snhg_diaporama]`, `[snhg_actualites]`, `[snhg_stations]`, `[snhg_mediatheque]`, `[snhg_gotalk]` et `[snhg_sous_nav]`.

## Licences des composants

- PDF.js 4.10.38 (Mozilla) : licence Apache 2.0, voir `js/pdfjs/LICENSE.txt`.
- Police Archivo : SIL Open Font License 1.1, voir `fonts/LISEZMOI.txt`.
