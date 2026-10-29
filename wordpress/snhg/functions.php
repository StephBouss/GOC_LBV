<?php
/**
 * Thème SNHG : la maquette du site statique (gabarit sources/gabarit.html, styles css/, script js/app.js) servie par
 * WordPress. Les fichiers PHP de ce dossier sont la source ; scripts/wordpress/construire.js les copie dans
 * wp-content/themes/snhg/ avec les fichiers du site et les données du dossier donnees/.
 *
 *  inc/outils.php      langue de la page, textes de l'interface (donnees/libelles.json), adresses des fichiers du thème,
 *                      sprite d'icônes (seules les icônes utilisées par la page)
 *  inc/contenus.php    types de contenus (diapositives, stations) et leurs champs (Secure Custom Fields)
 *  inc/document.php    <head> : titre, description, aperçus de partage, préchargements, styles et script
 *  inc/navigation.php  menus (principal, mobile, pied de page, liens légaux), bande de rubrique, sélecteur FR | EN
 *  inc/diaporama.php   [snhg_diaporama]  diaporama d'ouverture de l'accueil
 *  inc/actualites.php  [snhg_actualites] cartes d'articles, liste, filtres ; modèle des articles (single.php)
 *  inc/stations.php    [snhg_stations]   carte du Gabon, filtres et liste des stations Gab'Oil
 *  inc/mediatheque.php [snhg_mediatheque] galeries de photos (type de contenu « Galeries »)
 *  inc/gotalk.php      [snhg_gotalk]     portraits de talents (type de contenu « Portraits GO’TALK »)
 *  inc/importer.php    import des contenus préparés par scripts/wordpress/construire.js (chargé à la demande)
 */
defined('ABSPATH') || exit;

require __DIR__ . '/inc/outils.php';
require __DIR__ . '/inc/contenus.php';
require __DIR__ . '/inc/document.php';
require __DIR__ . '/inc/navigation.php';
require __DIR__ . '/inc/diaporama.php';
require __DIR__ . '/inc/actualites.php';
require __DIR__ . '/inc/stations.php';
require __DIR__ . '/inc/mediatheque.php';
require __DIR__ . '/inc/gotalk.php';
