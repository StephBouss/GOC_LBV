<?php
/**
 * Haut de page de la maquette (sources/gabarit.html) : <head>, sprite d'icônes, en-tête, menu mobile, ouverture du <main>.
 */
defined('ABSPATH') || exit;
?>
<!doctype html>
<html lang="<?php echo esc_attr(snhg_langue()); ?>">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
<?php wp_head(); ?>
  <script>document.documentElement.classList.add('js');</script>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <symbol id="i-chevron" viewBox="0 0 12 12"><path d="M2 4l4 4 4-4"/></symbol>
  <symbol id="i-fleche" viewBox="0 0 18 18"><path d="M3 9h12M11 5l4 4-4 4"/></symbol>
  <symbol id="i-pause" viewBox="0 0 24 24"><rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/></symbol>
  <symbol id="i-lecture" viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"/></symbol>
  <symbol id="i-menu" viewBox="0 0 24 24"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></symbol>
  <symbol id="i-fermer" viewBox="0 0 24 24"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></symbol>
  <symbol id="i-lieu" viewBox="0 0 24 24"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></symbol>
  <symbol id="i-tel" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></symbol>
  <symbol id="i-mail" viewBox="0 0 24 24"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></symbol>
  <symbol id="i-facebook" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></symbol>
  <symbol id="i-linkedin" viewBox="0 0 24 24"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></symbol>
  <symbol id="i-haut" viewBox="0 0 24 24"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></symbol>
  <symbol id="i-externe" viewBox="0 0 24 24"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></symbol>
  <symbol id="i-x" viewBox="0 0 24 24"><path d="M4 4l11.733 16h4.267l-11.733 -16z"/><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"/></symbol>
<!--snhg:icones-->
</svg>

<a class="evitement" href="#contenu"><?php echo esc_html(snhg_t('evitement')); ?></a>

<!-- ═══════════ En-tête (GOCHeader) ═══════════ -->
<header class="entete">
  <div class="lisere" aria-hidden="true"></div>
  <div class="entete-barre">
    <a class="entete-logo" href="<?php echo esc_url(snhg_accueil()); ?>" aria-label="<?php echo esc_attr(snhg_t('logo-accueil')); ?>">
      <img src="<?php echo esc_url(snhg_fichier('img/logo-goc.png')); ?>" alt="Gabon Oil Company" width="962" height="184">
    </a>

    <nav class="nav-principale" aria-label="<?php echo esc_attr(snhg_t('nav-principale')); ?>">
      <ul class="nav-onglets">
<?php echo snhg_nav_principale(); ?>      </ul>
    </nav>

    <div class="entete-actions">
<?php echo snhg_langues('      '); ?>      <button class="bouton-menu" type="button" aria-expanded="false" aria-controls="menu-mobile" aria-label="<?php echo esc_attr(snhg_t('ouvrir-menu')); ?>"><svg class="icone" aria-hidden="true"><use href="#i-menu"/></svg></button>
    </div>
  </div>
  <div class="progression" aria-hidden="true"></div>
</header>

<!-- Menu tablette et smartphone -->
<div class="menu-mobile" id="menu-mobile" role="dialog" aria-modal="true" aria-label="<?php echo esc_attr(snhg_t('menu')); ?>" hidden>
  <div class="lisere" aria-hidden="true"></div>
  <div class="menu-mobile-tete">
    <img src="<?php echo esc_url(snhg_fichier('img/logo-goc.png')); ?>" alt="Gabon Oil Company" width="962" height="184">
    <button type="button" class="fermer-menu" aria-label="<?php echo esc_attr(snhg_t('fermer-menu')); ?>"><svg class="icone" aria-hidden="true"><use href="#i-fermer"/></svg></button>
  </div>
  <nav class="menu-mobile-nav" aria-label="<?php echo esc_attr(snhg_t('nav-mobile')); ?>">
<?php echo snhg_nav_mobile(); ?>  </nav>
  <div class="menu-mobile-pied">
<?php echo snhg_langues('    '); ?>  </div>
</div>

<main id="contenu">
