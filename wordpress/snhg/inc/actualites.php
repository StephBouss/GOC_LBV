<?php
/**
 * Actualités : les articles de WordPress (titre, extrait = chapô, image à la une, catégorie, date), mis en forme comme
 * dans scripts/actualites.js.
 *
 *  [snhg_actualites vue="accueil"]  les 3 articles les plus récents (accueil)
 *  [snhg_actualites vue="liste"]    20 articles au plus, du plus récent au plus ancien (page Actualités)
 *  [snhg_actualites vue="filtres"]  catégories non vides, filtrées sur place par app.js (?categorie=…)
 *  [snhg_actualites vue="nombre"]   nombre d'articles de la liste
 *  snhg_article()                   page d'un article (single.php) : en-tête, image, contenu, « À lire aussi »
 *
 * Une catégorie est repérée dans les deux langues par son identifiant français (métadonnée snhg_cle), comme dans
 * l'adresse ?categorie=… : le sélecteur de langue garde ainsi le filtre choisi.
 */
defined('ABSPATH') || exit;

const SNHG_MAX_LISTE = 20;
const SNHG_MAX_ACCUEIL = 3;
const SNHG_TAILLES_ACCUEIL = '(max-width: 767px) 85vw, (max-width: 1023px) 44vw, 28vw';
const SNHG_TAILLES_LISTE = '(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 28vw';
const SNHG_TAILLES_ARTICLE = '(max-width: 767px) 100vw, 54rem';

function snhg_articles(int $nombre, array $autres = []): array {
	return get_posts(array_merge(['post_type' => 'post', 'post_status' => 'publish', 'posts_per_page' => $nombre,
		'orderby' => 'date', 'order' => 'DESC', 'lang' => snhg_langue(), 'no_found_rows' => true], $autres));
}

function snhg_categorie(WP_Post $a): array {
	$termes = get_the_category($a->ID);
	$t = $termes[0] ?? null;
	if (!$t) return ['cle' => '', 'nom' => ''];
	return ['cle' => get_term_meta($t->term_id, 'snhg_cle', true) ?: $t->slug, 'nom' => $t->name, 'terme' => $t];
}

/* Le jour de publication n'est pas toujours connu : la date s'affiche au mois, comme sur le site de référence */
function snhg_date(WP_Post $a): string {
	$mois = snhg_t('mois');
	return '<time datetime="' . esc_attr(get_the_date('Y-m', $a)) . '">' . esc_html($mois[(int) get_the_date('n', $a) - 1] . ' ' . get_the_date('Y', $a)) . '</time>';
}

/* Image à la une : variantes de taille de la médiathèque (photos), fichier unique (illustrations SVG) */
function snhg_image_article(WP_Post $a, string $tailles, bool $prioritaire = false): string {
	$id = get_post_thumbnail_id($a);
	if (!$id) return '';
	$alt = snhg_champ('texte_alternatif', $a->ID) ?: get_post_meta($id, '_wp_attachment_image_alt', true);
	$image = wp_get_attachment_image_src($id, 'full');
	if (!$image) return '';
	$svg = get_post_mime_type($id) === 'image/svg+xml';
	$srcset = $svg ? '' : (string) wp_get_attachment_image_srcset($id, 'full');
	$cadrage = snhg_champ('cadrage', $a->ID);
	return '<img src="' . esc_url($image[0]) . '"' . ($srcset ? ' srcset="' . esc_attr($srcset) . '" sizes="' . esc_attr($tailles) . '"' : '')
		. ' alt="' . snhg_attribut($alt) . '" width="' . (int) $image[1] . '" height="' . (int) $image[2] . '"'
		. ($prioritaire ? ' fetchpriority="high"' : ' loading="lazy"') . ($cadrage ? ' style="object-position: ' . esc_attr($cadrage) . '"' : '') . '>';
}

function snhg_carte_actu(WP_Post $a, string $tailles, string $r = '        '): string {
	$c = snhg_categorie($a);
	return "$r<article class=\"carte-actu\" data-categorie=\"" . esc_attr($c['cle']) . "\">\n"
		. "$r  <div class=\"carte-actu-photo\">" . snhg_image_article($a, $tailles) . "</div>\n"
		. "$r  <div class=\"carte-actu-corps\">\n"
		. "$r    <p class=\"carte-actu-meta\"><span class=\"categorie\">" . esc_html($c['nom']) . '</span>' . snhg_date($a) . "</p>\n"
		. "$r    <h3><a href=\"" . esc_url(snhg_permalien($a->ID)) . '">' . wp_kses_post(get_the_title($a)) . "</a></h3>\n"
		. "$r    <p class=\"extrait\">" . wp_kses_post($a->post_excerpt) . "</p>\n"
		. "$r    <span class=\"lire\" aria-hidden=\"true\">" . esc_html(snhg_t('lire-la-suite')) . " <svg><use href=\"#i-fleche\"/></svg></span>\n"
		. "$r  </div>\n$r</article>";
}

function snhg_lien_actualites(string $categorie = ''): string {
	$url = snhg_lien_page('actualites/index.html');
	return $categorie ? add_query_arg('categorie', $categorie, $url) : $url;
}

/* Catégories dans l'ordre du site (métadonnée snhg_ordre), avec le nombre d'articles de la liste */
function snhg_filtres_actualites(): string {
	$affiches = snhg_articles(SNHG_MAX_LISTE);
	$nombres = [];
	foreach ($affiches as $a) { $c = snhg_categorie($a)['cle']; $nombres[$c] = ($nombres[$c] ?? 0) + 1; }
	$compte = fn($n) => '<span class="filtre-nombre">' . $n . '<span class="visuellement-masque"> ' . esc_html($n > 1 ? snhg_t('articles') : snhg_t('article')) . '</span></span>';
	$termes = get_terms(['taxonomy' => 'category', 'hide_empty' => false, 'lang' => snhg_langue()]);
	$termes = is_array($termes) ? $termes : [];
	usort($termes, fn($x, $y) => (int) get_term_meta($x->term_id, 'snhg_ordre', true) <=> (int) get_term_meta($y->term_id, 'snhg_ordre', true));
	$items = ['<li><a href="' . esc_url(snhg_lien_actualites()) . '" data-filtre="" aria-current="true">' . esc_html(snhg_t('toutes-categories')) . ' ' . $compte(count($affiches)) . '</a></li>'];
	foreach ($termes as $t) {
		$cle = get_term_meta($t->term_id, 'snhg_cle', true) ?: $t->slug;
		if (empty($nombres[$cle])) continue;
		$items[] = '<li><a href="' . esc_url(snhg_lien_actualites($cle)) . '" data-filtre="' . esc_attr($cle) . '" data-nom="' . esc_attr($t->name) . '">' . esc_html($t->name) . ' ' . $compte($nombres[$cle]) . '</a></li>';
	}
	return implode("\n", array_map(fn($i) => "          $i", $items));
}

add_shortcode('snhg_actualites', function ($attributs) {
	$vue = shortcode_atts(['vue' => 'accueil'], $attributs)['vue'];
	switch ($vue) {
		case 'accueil':
			return ltrim(implode("\n", array_map(fn($a) => snhg_carte_actu($a, SNHG_TAILLES_ACCUEIL), snhg_articles(SNHG_MAX_ACCUEIL))));
		case 'liste':
			return ltrim(implode("\n", array_map(fn($a) => snhg_carte_actu($a, SNHG_TAILLES_LISTE), snhg_articles(SNHG_MAX_LISTE))));
		case 'filtres':
			return ltrim(snhg_filtres_actualites());
		case 'nombre':
			return (string) count(snhg_articles(SNHG_MAX_LISTE, ['fields' => 'ids']));
	}
	return '';
});

/* Articles : mêmes tailles d'image que la maquette dans le corps de l'article */
add_filter('wp_calculate_image_sizes', function ($tailles) {
	return is_singular('post') && in_the_loop() ? '(max-width: 767px) 100vw, 46rem' : $tailles;
});

/* Photos du corps de l'article : chargées en différé ; seule l'image d'ouverture, posée par le modèle, est prioritaire */
add_filter('wp_get_loading_optimization_attributes', function ($attributs, $balise, $attr, $contexte) {
	return $contexte === 'the_content' && is_singular('post') ? ['loading' => 'lazy'] : $attributs;
}, 10, 4);

function snhg_minutes_lecture(WP_Post $a): int {
	return max(1, (int) round(count(preg_split('/\s+/u', trim(wp_strip_all_tags($a->post_content)))) / 200));
}

/* Image d'ouverture de l'article, préchargée dans le <head> */
function snhg_article_prechargement(WP_Post $a): ?array {
	$id = get_post_thumbnail_id($a);
	if (!$id) return null;
	if (get_post_mime_type($id) === 'image/svg+xml') return ['src' => wp_get_attachment_url($id)];
	return ['src' => wp_get_attachment_image_url($id, 'full'), 'srcset' => wp_get_attachment_image_srcset($id, 'full'), 'sizes' => SNHG_TAILLES_ARTICLE];
}

/* Page d'un article (modèle single.html de la maquette) ; $corps est son contenu mis en forme */
function snhg_article(WP_Post $a, string $corps): string {
	$c = snhg_categorie($a);
	$autres = snhg_articles(SNHG_MAX_LISTE, ['post__not_in' => [$a->ID]]);
	$meme = array_filter($autres, fn($x) => snhg_categorie($x)['cle'] === $c['cle']);
	$a_lire = array_slice(array_merge($meme, array_filter($autres, fn($x) => snhg_categorie($x)['cle'] !== $c['cle'])), 0, 3);
	$id_image = get_post_thumbnail_id($a);
	$illustration = $id_image && get_post_mime_type($id_image) === 'image/svg+xml' ? ' illustration' : '';
	$actualites = esc_url(snhg_lien_actualites());
	$fleche = '<svg aria-hidden="true"><use href="#i-fleche"/></svg>';
	return '
  <!-- Navigation de la rubrique -->
  <nav class="sous-nav" aria-label="' . esc_attr(snhg_t('rubrique-information')) . '">
    <ul>
      <li><a href="' . $actualites . '" aria-current="true">' . esc_html(snhg_t('actualites')) . '</a></li>
      <li><a href="' . esc_url(snhg_lien_page('rapports-publications/index.html')) . '">' . esc_html(snhg_t('rapports-publications')) . '</a></li>
      <li><a href="' . esc_url(snhg_lien_page('mediatheque/index.html')) . '">' . esc_html(snhg_t('mediatheque')) . '</a></li>
    </ul>
  </nav>

  <!-- ═══════════ Article (modèle single.html) ═══════════ -->
  <article class="article" aria-labelledby="article-titre">
    <header class="conteneur article-tete">
      <nav class="fil-ariane" aria-label="' . esc_attr(snhg_t('fil-ariane')) . '">
        <ol>
          <li><a href="' . esc_url(snhg_accueil()) . '">' . esc_html(snhg_t('accueil')) . '</a></li>
          <li><a href="' . $actualites . '">' . esc_html(snhg_t('actualites')) . '</a></li>
          <li><a href="' . esc_url(snhg_lien_actualites($c['cle'])) . '">' . esc_html($c['nom']) . '</a></li>
        </ol>
      </nav>
      <p class="sur-titre">' . esc_html($c['nom']) . '</p>
      <h1 class="article-titre" id="article-titre">' . wp_kses_post(get_the_title($a)) . '</h1>
      <p class="article-chapo">' . wp_kses_post($a->post_excerpt) . '</p>
      <p class="article-meta">' . snhg_date($a) . '<span aria-hidden="true">·</span>' . esc_html(snhg_t('minutes-lecture', ['n' => snhg_minutes_lecture($a)])) . '</p>
    </header>
    <figure class="conteneur article-image' . $illustration . '">' . snhg_image_article($a, SNHG_TAILLES_ARTICLE, true) . '</figure>
    <div class="conteneur article-corps">
' . trim($corps) . '
      <p class="article-retour"><a class="lien-fleche" href="' . $actualites . '">' . esc_html(snhg_t('toutes-actualites')) . ' ' . $fleche . '</a></p>
    </div>
  </article>

  <!-- ═══════════ À lire aussi (même catégorie d\'abord, puis les plus récents) ═══════════ -->
  <section class="section fond-surface" aria-labelledby="autres-titre">
    <div class="conteneur">
      <div class="tete-section" data-apparition>
        <div>
          <p class="sur-titre">' . esc_html(snhg_t('a-lire-aussi')) . '</p>
          <h2 class="titre-section" id="autres-titre">' . esc_html(snhg_t('autres-actualites')) . '</h2>
        </div>
        <a class="lien-fleche" href="' . $actualites . '">' . esc_html(snhg_t('toutes-actualites')) . ' ' . $fleche . '</a>
      </div>
      <div class="liste-actus" data-cascade>
' . implode("\n", array_map(fn($x) => snhg_carte_actu($x, SNHG_TAILLES_LISTE), $a_lire)) . '
      </div>
    </div>
  </section>
';
}

/* Adresses des articles : /actualites/<slug>/ en français (réglage des permaliens), /en/news/<slug>/ en anglais, sous
   la page News comme dans le site statique. La version gratuite de Polylang ne traduit pas cette base : le thème la
   remplace dans l'adresse des articles anglais et ajoute la règle qui les retrouve (permaliens à réenregistrer après
   un changement). Une ancienne adresse /en/actualites/… renvoie vers la nouvelle (redirection canonique de WordPress). */
const SNHG_BASE_ARTICLES = ['en' => 'news'];

add_filter('post_link', function ($url, $article) {
	if (!function_exists('pll_get_post_language')) return $url;
	$base = SNHG_BASE_ARTICLES[pll_get_post_language($article->ID)] ?? '';
	return $base ? preg_replace('#/actualites/([^/]+)/$#', "/$base/\$1/", $url) : $url;
}, 100, 2);

add_action('init', function () {
	foreach (SNHG_BASE_ARTICLES as $langue => $base) {
		add_rewrite_rule("^$langue/$base/([^/]+)/?$", 'index.php?lang=' . $langue . '&name=$matches[1]', 'top');
	}
});

/* Un article demandé à une autre adresse que la sienne (ancienne base, langue erronée) : redirection permanente vers
   son adresse, avant celle de Polylang, qui ne connaît pas la base anglaise */
add_action('template_redirect', function () {
	if (!is_singular('post') || is_preview() || get_post_status() !== 'publish') return;
	$adresse = get_permalink(get_queried_object_id());
	$demandee = wp_parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
	if ($demandee && untrailingslashit(wp_parse_url($adresse, PHP_URL_PATH)) !== untrailingslashit($demandee)) {
		wp_safe_redirect($adresse, 301);
		exit;
	}
}, 0);

/* Archives de catégorie : la page Actualités, filtrée sur la catégorie (comme les liens des filtres) */
add_action('template_redirect', function () {
	if (!is_category()) return;
	$t = get_queried_object();
	wp_safe_redirect(snhg_lien_actualites(get_term_meta($t->term_id, 'snhg_cle', true) ?: $t->slug), 302);
	exit;
});
