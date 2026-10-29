<?php
/**
 * Bas de page de la maquette (sources/gabarit.html) : fermeture du <main>, pied de page, puis ce que la page place
 * après lui (fenêtres modales, repère <!-- snhg:apres --> de son contenu), bouton de retour en haut et scripts.
 */
defined('ABSPATH') || exit;
?>
</main>

<!-- ═══════════ Pied de page (GOCFooter) ═══════════ -->
<footer class="pied">
  <div class="lisere" aria-hidden="true"></div>
  <div class="conteneur pied-interieur">
    <div class="pied-haut" data-cascade>
      <div class="pied-identite">
        <div class="pied-logo"><img src="<?php echo esc_url(snhg_fichier('img/logo-goc-blanc.svg')); ?>" alt="Gabon Oil Company" width="1413" height="938" loading="lazy"></div>
        <p><?php echo esc_html(snhg_t('pied-texte')); ?></p>
        <address class="pied-coordonnees">
          <span><svg class="icone" aria-hidden="true"><use href="#i-lieu"/></svg>1586 avenue Paul Moukambi, BP 635 Libreville, Gabon</span>
          <a href="tel:+24111484100"><svg class="icone" aria-hidden="true"><use href="#i-tel"/></svg>+241 11 48 41 00</a>
          <a href="mailto:contact@gabonoil.com"><svg class="icone" aria-hidden="true"><use href="#i-mail"/></svg>contact@gabonoil.com</a>
        </address>
        <ul class="reseaux" aria-label="<?php echo esc_attr(snhg_t('reseaux')); ?>">
          <li><a href="https://www.facebook.com/GabOilSA/" target="_blank" rel="noopener noreferrer" aria-label="Facebook (<?php echo esc_attr(snhg_t('nouvel-onglet')); ?>)"><svg class="icone" aria-hidden="true"><use href="#i-facebook"/></svg></a></li>
          <li><a href="https://www.linkedin.com/company/gabon-oil/posts/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn (<?php echo esc_attr(snhg_t('nouvel-onglet')); ?>)"><svg class="icone" aria-hidden="true"><use href="#i-linkedin"/></svg></a></li>
          <li><a href="https://x.com/groupegabonoil" target="_blank" rel="noopener noreferrer" aria-label="X (<?php echo esc_attr(snhg_t('nouvel-onglet')); ?>)"><svg class="icone" aria-hidden="true"><use href="#i-x"/></svg></a></li>
        </ul>
      </div>
      <nav class="pied-liens" aria-label="<?php echo esc_attr(snhg_t('plan-du-site')); ?>">
<?php echo snhg_pied_colonnes(); ?>      </nav>
    </div>
    <div class="pied-separateur" aria-hidden="true"></div>
    <div class="pied-bas">
      <p><?php echo esc_html(snhg_t('droits')); ?></p>
      <ul>
<?php echo snhg_pied_legal(); ?>      </ul>
    </div>
  </div>
</footer>
<?php echo $GLOBALS['snhg_apres'] ?? ''; ?>

<button class="haut-de-page" type="button" aria-label="<?php echo esc_attr(snhg_t('haut-de-page')); ?>"><svg class="icone" aria-hidden="true"><use href="#i-haut"/></svg></button>

<?php wp_footer(); ?>
</body>
</html>
