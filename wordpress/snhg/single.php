<?php
/**
 * Article d'actualité : mis en page par snhg_article() (inc/actualites.php) avant l'en-tête, pour précharger son image.
 */
defined('ABSPATH') || exit;

the_post();
$GLOBALS['snhg_precharger'] = snhg_article_prechargement(get_post());
$html = snhg_article(get_post(), apply_filters('the_content', get_the_content()));
get_header();
echo $html;
get_footer();
