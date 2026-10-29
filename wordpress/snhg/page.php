<?php
/**
 * Page : son contenu (blocs « HTML personnalisé » de la maquette et codes courts du thème) est mis en forme avant
 * l'en-tête, pour que le diaporama de l'accueil puisse faire précharger sa première image dans le <head>.
 */
defined('ABSPATH') || exit;

the_post();
$contenu = snhg_contenu();
get_header();
echo $contenu;
get_footer();
