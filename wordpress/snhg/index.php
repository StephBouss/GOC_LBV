<?php
/**
 * Modèle de secours de WordPress (adresse sans page, archives, recherche) : renvoie vers la page Actualités pour les
 * listes d'articles, et affiche sinon la page « introuvable » dans la mise en page du site.
 */
defined('ABSPATH') || exit;

if ((is_home() || is_archive()) && !is_404()) {
	wp_safe_redirect(snhg_lien_actualites(), 302);
	exit;
}
status_header(404);
get_header();
?>
  <section class="page-hero" aria-labelledby="page-titre">
    <div class="conteneur page-hero-contenu">
      <h1 class="page-hero-titre" id="page-titre"><?php echo snhg_langue() === 'en' ? 'Page not found' : 'Page introuvable'; ?></h1>
    </div>
  </section>
  <section class="section">
    <div class="conteneur">
      <p class="texte-encre"><?php echo snhg_langue() === 'en' ? 'This page does not exist or has moved.' : "Cette page n'existe pas ou a changé d'adresse."; ?></p>
      <p><a class="lien-fleche" href="<?php echo esc_url(snhg_accueil()); ?>"><?php echo esc_html(snhg_t('accueil')); ?> <svg aria-hidden="true"><use href="#i-fleche"/></svg></a></p>
    </div>
  </section>
<?php
get_footer();
