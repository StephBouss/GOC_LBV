<?php
/**
 * Import des contenus préparés par scripts/wordpress/construire.js (wp-content/uploads/snhg-import/contenus.json).
 * Chargé à la demande par scripts/wordpress/importer.php, jamais par les pages du site.
 *
 * Chaque contenu importé porte sa clé (métadonnée _snhg_cle : « fr:groupe/presentation.html », « en:champs »…) :
 * un nouvel import met à jour les mêmes pages, articles, diapositives et stations au lieu d'en créer d'autres.
 * Les fichiers versés dans la médiathèque sont repérés de même par leur chemin dans le site (_snhg_fichier).
 * Attention : un nouvel import remplace ce qui a été modifié dans l'administration pour ces contenus.
 *
 *  snhg_importer_langues()        langues de Polylang (français par défaut, à la racine ; anglais sous /en/) et réglages
 *  snhg_importer_contenus($c)     médias, pages, catégories, articles, diapositives, stations, menus, réglages du site
 *
 * Les deux étapes se font en deux fois : Polylang ne connaît les langues créées qu'au chargement suivant.
 */
defined('ABSPATH') || exit;

require_once ABSPATH . 'wp-admin/includes/file.php';
require_once ABSPATH . 'wp-admin/includes/media.php';
require_once ABSPATH . 'wp-admin/includes/image.php';
require_once ABSPATH . 'wp-admin/includes/post.php';
require_once ABSPATH . 'wp-admin/includes/nav-menu.php';

function snhg_importer_langues(): array {
	if (!function_exists('PLL')) return ['erreur' => 'Polylang inactif'];
	$bilan = [];
	$existantes = wp_list_pluck(PLL()->model->get_languages_list(), 'slug');
	foreach ([['locale' => 'fr_FR', 'slug' => 'fr', 'name' => 'Français', 'flag' => 'fr', 'term_group' => 0],
	          ['locale' => 'en_GB', 'slug' => 'en', 'name' => 'English', 'flag' => 'gb', 'term_group' => 1]] as $l) {
		if (in_array($l['slug'], $existantes, true)) { $bilan[$l['slug']] = 'déjà là'; continue; }
		$r = PLL()->model->languages->add($l + ['rtl' => false, 'no_default_cat' => true]);
		$bilan[$l['slug']] = is_wp_error($r) ? $r->get_error_message() : 'créée';
	}
	// Français à la racine sans /fr/, anglais sous /en/ (accueil anglais : /en/, sans le nom de la page) ;
	// pas de redirection selon la langue du navigateur
	$r = PLL()->options->merge(['default_lang' => 'fr', 'force_lang' => 1, 'hide_default' => true, 'rewrite' => true,
		'redirect_lang' => true, 'browser' => false, 'media_support' => false]);
	PLL()->options->save();
	$bilan['reglages'] = is_wp_error($r) && $r->has_errors() ? $r->get_error_messages() : 'ok';
	return $bilan;
}

/* Contenu existant repéré par sa clé d'import */
function snhg_trouver(string $type, string $cle): int {
	$ids = get_posts(['post_type' => $type, 'post_status' => 'any', 'meta_key' => '_snhg_cle', 'meta_value' => $cle,
		'posts_per_page' => 1, 'fields' => 'ids', 'lang' => '', 'no_found_rows' => true, 'suppress_filters' => true]);
	return $ids ? (int) $ids[0] : 0;
}

function snhg_enregistrer(string $type, string $cle, array $donnees): int {
	$id = snhg_trouver($type, $cle);
	$donnees = array_merge(['post_type' => $type, 'post_status' => 'publish'], $donnees);
	if ($id) $donnees['ID'] = $id;
	$id = wp_insert_post(wp_slash($donnees), true);
	if (is_wp_error($id)) throw new RuntimeException("$cle : " . $id->get_error_message());
	update_post_meta($id, '_snhg_cle', $cle);
	return $id;
}

/* Fichier du site (dans le thème) versé dans la médiathèque, une seule fois */
function snhg_importer_media(string $fichier, string $alt): int {
	$ids = get_posts(['post_type' => 'attachment', 'post_status' => 'inherit', 'meta_key' => '_snhg_fichier', 'meta_value' => $fichier,
		'posts_per_page' => 1, 'fields' => 'ids', 'lang' => '', 'suppress_filters' => true]);
	if ($ids) {
		// Photo versée sans ses variantes de taille (PHP sans l'extension GD) : variantes créées maintenant
		$meta = wp_get_attachment_metadata($ids[0]);
		if (wp_attachment_is_image($ids[0]) && substr($fichier, -4) !== '.svg' && empty($meta['sizes']) && wp_image_editor_supports(['mime_type' => get_post_mime_type($ids[0])])) {
			wp_update_attachment_metadata($ids[0], wp_generate_attachment_metadata($ids[0], get_attached_file($ids[0])));
		}
		return (int) $ids[0];
	}
	$source = get_template_directory() . '/' . $fichier;
	if (!is_file($source)) throw new RuntimeException("fichier introuvable : $source");
	$temporaire = wp_tempnam(basename($fichier));
	copy($source, $temporaire);
	$svg = substr($fichier, -4) === '.svg';
	$autoriser = fn($types) => $types + ['svg' => 'image/svg+xml'];
	$verifier = fn($donnees, $f, $nom) => $svg ? ['ext' => 'svg', 'type' => 'image/svg+xml', 'proper_filename' => false] : $donnees;
	add_filter('upload_mimes', $autoriser);
	add_filter('wp_check_filetype_and_ext', $verifier, 10, 3);
	$id = media_handle_sideload(['name' => basename($fichier), 'tmp_name' => $temporaire], 0, null, ['post_title' => pathinfo($fichier, PATHINFO_FILENAME)]);
	remove_filter('upload_mimes', $autoriser);
	remove_filter('wp_check_filetype_and_ext', $verifier, 10);
	if (is_wp_error($id)) { @unlink($temporaire); throw new RuntimeException("$fichier : " . $id->get_error_message()); }
	// Une image SVG n'a pas de dimensions pour WordPress : celles de son attribut viewBox
	if ($svg && preg_match('/viewBox="[\d.\s-]*?\s([\d.]+)\s([\d.]+)"/', file_get_contents($source), $m)) {
		wp_update_attachment_metadata($id, ['width' => (int) round($m[1]), 'height' => (int) round($m[2]), 'file' => _wp_relative_upload_path(get_attached_file($id))]);
	}
	update_post_meta($id, '_snhg_fichier', $fichier);
	if ($alt) update_post_meta($id, '_wp_attachment_image_alt', $alt);
	return $id;
}

/* Champ Secure Custom Fields par sa clé (enregistré comme si on l'avait rempli dans l'administration) */
function snhg_remplir(int $id, array $champs): void {
	foreach ($champs as $cle => $valeur) {
		if (function_exists('update_field')) update_field($cle, $valeur, $id);
	}
}

/* Jetons d'adresse des contenus préparés → adresses WordPress : {{theme}} (dossier du thème), {{page:<langue>:<page>}},
   {{article:<langue>:<slug français>}} ; $pages et $articles donnent l'identifiant de chaque contenu par sa clé d'import */
function snhg_resoudre_liens(string $html, array $pages, array $articles): string {
	return preg_replace_callback('/\{\{(theme|page|article):?([a-z]*):?([^}]*)\}\}/', function ($m) use ($pages, $articles) {
		if ($m[1] === 'theme') return get_template_directory_uri();
		$id = $m[1] === 'page' ? ($pages["{$m[2]}:{$m[3]}"] ?? 0) : ($articles["{$m[2]}:{$m[3]}"] ?? 0);
		if (!$id) throw new RuntimeException("lien introuvable : {$m[0]}");
		return snhg_permalien($id);
	}, $html);
}

/* Clés d'import des contenus déjà dans WordPress : clé → identifiant */
function snhg_cles(string $type): array {
	global $wpdb;
	$lignes = $wpdb->get_results($wpdb->prepare("SELECT m.meta_value AS cle, p.ID AS id FROM {$wpdb->postmeta} m JOIN {$wpdb->posts} p ON p.ID = m.post_id
		WHERE m.meta_key = '_snhg_cle' AND p.post_type = %s AND p.post_status <> 'trash'", $type));
	return array_column(array_map(fn($l) => [$l->cle, (int) $l->id], $lignes), 1, 0);
}

/* Page créée (ou reprise) sans contenu, avec son parent, sa langue et ses réglages ; $chemins donne l'identifiant de chaque
   page par « langue|chemin », pour retrouver le parent (les parents passent avant leurs enfants) */
function snhg_creer_page(array $p, int $rang, array &$chemins): int {
	$parent = count($p['chemin']) > 1 ? ($chemins[$p['langue'] . '|' . implode('/', array_slice($p['chemin'], 0, -1))] ?? 0) : 0;
	$slug = $p['chemin'] ? end($p['chemin']) : ($p['langue'] === 'fr' ? 'accueil' : 'home');
	$id = snhg_enregistrer('page', $p['cle'], ['post_title' => $p['titre'], 'post_name' => $slug, 'post_parent' => $parent, 'menu_order' => $rang, 'post_content' => '']);
	pll_set_post_language($id, $p['langue']);
	$chemins[$p['langue'] . '|' . implode('/', $p['chemin'])] = $id;
	snhg_regler_page($id, $p);
	return $id;
}

/* Réglages d'une page tirés de l'en-tête de sa source : titre et description pour les moteurs de recherche, onglet du menu,
   image préchargée, feuilles de style, image de partage, redirection */
function snhg_regler_page(int $id, array $p): void {
	snhg_remplir($id, ['field_snhg_page_titre' => $p['meta']['titre'], 'field_snhg_page_description' => $p['meta']['description'], 'field_snhg_page_onglet' => $p['meta']['onglet']]);
	foreach (['precharger', 'css', 'partage'] as $m) {
		$valeur = $p['meta'][$m] ?? null;
		if ($valeur && $valeur !== 'diaporama') update_post_meta($id, "_snhg_$m", wp_slash(wp_json_encode($valeur, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)));
		else delete_post_meta($id, "_snhg_$m");
	}
	if (!empty($p['redirection'])) update_post_meta($id, '_snhg_redirection', $p['redirection']);
	else delete_post_meta($id, '_snhg_redirection');
	// Sous-page sans entrée de menu : clé d'import de sa page parente, signalée dans la bande de navigation de la rubrique
	if (!empty($p['meta']['parent'])) update_post_meta($id, '_snhg_parent', "{$p['langue']}:{$p['meta']['parent']}");
	else delete_post_meta($id, '_snhg_parent');
}

/* Contenu et réglages de quelques pages seulement (clés « fr:groupe/presentation.html »…), sans toucher au reste du site : pour
   reporter une modification des sources sans réimporter ce qui a pu être modifié dans l'administration. Une page nouvelle
   des sources est créée, rattachée à sa traduction déjà présente */
function snhg_importer_pages(array $c, array $cles): array {
	kses_remove_filters();
	$pages = snhg_cles('page');
	$articles = snhg_cles('post');
	$bilan = [];
	$chemins = [];
	foreach ($c['pages'] as $p) if (!empty($pages[$p['cle']])) $chemins[$p['langue'] . '|' . implode('/', $p['chemin'])] = $pages[$p['cle']];
	$nouvelles = [];
	foreach ($c['pages'] as $rang => $p) {
		if (!in_array($p['cle'], $cles, true) || !empty($pages[$p['cle']])) continue;
		$pages[$p['cle']] = snhg_creer_page($p, $rang, $chemins);
		$nouvelles[$p['identite']] = true;
		$bilan[$p['cle']] = 'créée';
	}
	$traductions = [];
	foreach ($c['pages'] as $p) if (isset($nouvelles[$p['identite']]) && !empty($pages[$p['cle']])) $traductions[$p['identite']][$p['langue']] = $pages[$p['cle']];
	foreach ($traductions as $t) if (count($t) > 1) pll_save_post_translations($t);
	foreach ($c['pages'] as $p) {
		if (!in_array($p['cle'], $cles, true)) continue;
		if (($bilan[$p['cle']] ?? '') !== 'créée') snhg_regler_page($pages[$p['cle']], $p);
		$r = wp_update_post(wp_slash(['ID' => $pages[$p['cle']], 'post_content' => snhg_resoudre_liens($p['contenu'], $pages, $articles)]), true);
		if (is_wp_error($r)) throw new RuntimeException("{$p['cle']} : " . $r->get_error_message());
		$bilan[$p['cle']] = $bilan[$p['cle']] ?? 'mise à jour';
	}
	foreach (array_diff($cles, array_keys($bilan)) as $inconnue) $bilan[$inconnue] = 'inconnue dans les contenus préparés';
	return $bilan;
}

function snhg_importer_contenus(array $c): array {
	if (!function_exists('update_field') || !function_exists('pll_set_post_language')) throw new RuntimeException('Secure Custom Fields et Polylang doivent être actifs');
	kses_remove_filters();
	wp_defer_term_counting(true);
	$bilan = [];

	// Médiathèque : photos, vidéos et illustrations des articles, diapositives et stations
	$medias = [];
	foreach ($c['medias'] as $m) $medias[$m['fichier']] = snhg_importer_media($m['fichier'], $m['alt']);
	$bilan['medias'] = count($medias);
	$media = fn($f) => $f ? ($medias[$f] ?? 0) : 0;

	// Pages : d'abord créées, avec leur parent, leur langue et leurs traductions ; liens résolus ensuite
	$pages = [];
	$chemins = [];
	foreach ($c['pages'] as $rang => $p) $pages[$p['cle']] = snhg_creer_page($p, $rang, $chemins);
	$traductions = [];
	foreach ($c['pages'] as $p) $traductions[$p['identite']][$p['langue']] = $pages[$p['cle']];
	foreach ($traductions as $t) if (count($t) > 1) pll_save_post_translations($t);
	$bilan['pages'] = count($pages);

	// Catégories, traduites ; repérées dans les deux langues par l'identifiant français (snhg_cle)
	$categories = [];
	foreach ($c['categories'] as $rang => $cat) {
		$groupe = [];
		foreach ($c['langues'] as $l) {
			$slug = $l === 'fr' ? $cat['cle'] : $cat['cle'] . '-' . $l;
			$terme = get_term_by('slug', $slug, 'category');
			$r = $terme ? wp_update_term($terme->term_id, 'category', ['name' => $cat[$l]]) : wp_insert_term($cat[$l], 'category', ['slug' => $slug]);
			if (is_wp_error($r)) throw new RuntimeException("catégorie $slug : " . $r->get_error_message());
			$id = (int) $r['term_id'];
			pll_set_term_language($id, $l);
			update_term_meta($id, 'snhg_cle', $cat['cle']);
			update_term_meta($id, 'snhg_ordre', $rang + 1);
			$categories[$l][$cat['cle']] = $groupe[$l] = $id;
		}
		pll_save_term_translations($groupe);
	}

	// Articles : paragraphes et photos de la galerie (après le deuxième paragraphe) en blocs de l'éditeur
	$articles = [];
	foreach ($c['articles'] as $a) {
		$blocs = array_map(fn($p) => "<!-- wp:paragraph -->\n<p>$p</p>\n<!-- /wp:paragraph -->", $a['contenu']);
		$figures = array_map(function ($g) use ($media) {
			$id = $media($g['fichier']);
			$classe = 'article-figure' . ($g['hauteur'] > $g['largeur'] ? ' portrait' : '');
			return '<!-- wp:image ' . wp_json_encode(['id' => $id, 'sizeSlug' => 'full', 'linkDestination' => 'none', 'className' => $classe]) . " -->\n"
				. '<figure class="wp-block-image size-full ' . $classe . '"><img src="' . esc_url(wp_get_attachment_url($id)) . '" alt="' . esc_attr($g['alt']) . '" class="wp-image-' . $id . "\"/></figure>\n<!-- /wp:image -->";
		}, $a['galerie']);
		array_splice($blocs, min(2, count($blocs)), 0, $figures);
		$id = snhg_enregistrer('post', "{$a['langue']}:{$a['cle']}", [
			'post_title' => $a['titre'], 'post_name' => $a['slug'], 'post_excerpt' => $a['extrait'],
			'post_date' => $a['date'] . ' 08:00:00', 'post_content' => implode("\n\n", $blocs),
			'post_category' => [$categories[$a['langue']][$a['categorie']]],
		]);
		pll_set_post_language($id, $a['langue']);
		set_post_thumbnail($id, $media($a['image']['fichier']));
		snhg_remplir($id, ['field_snhg_article_alt' => $a['image']['alt'], 'field_snhg_article_cadrage' => $a['image']['position']]);
		$articles["{$a['langue']}:{$a['cle']}"] = $id;
	}
	$groupes = [];
	foreach ($c['articles'] as $a) $groupes[$a['cle']][$a['langue']] = $articles["{$a['langue']}:{$a['cle']}"];
	foreach ($groupes as $t) if (count($t) > 1) pll_save_post_translations($t);
	$bilan['articles'] = count($articles);

	// Adresses : fichiers du thème, pages et articles dans leur langue
	$liens = fn(string $html) => snhg_resoudre_liens($html, $pages, $articles);
	foreach ($c['pages'] as $p) {
		wp_update_post(wp_slash(['ID' => $pages[$p['cle']], 'post_content' => $liens($p['contenu'])]));
	}
	foreach ($articles as $id) {
		$contenu = get_post_field('post_content', $id);
		if (strpos($contenu, '{{') !== false) wp_update_post(wp_slash(['ID' => $id, 'post_content' => $liens($contenu)]));
	}

	// Diapositives de l'accueil, dans chaque langue
	$diapos = [];
	foreach ($c['diapositives'] as $d) {
		$id = snhg_enregistrer('snhg_diapositive', "{$d['langue']}:{$d['cle']}", ['post_title' => wp_strip_all_tags($d['titre']), 'post_name' => "{$d['cle']}-{$d['langue']}", 'menu_order' => $d['ordre']]);
		pll_set_post_language($id, $d['langue']);
		$f = $d['fond'];
		snhg_remplir($id, [
			'field_snhg_diapo_sur_titre' => $d['sur_titre'], 'field_snhg_diapo_titre' => $d['titre'], 'field_snhg_diapo_chapo' => $d['chapo'],
			'field_snhg_diapo_duree' => $d['duree'], 'field_snhg_diapo_type_fond' => $f['type'],
			'field_snhg_diapo_video' => $media($f['mp4'] ?? null), 'field_snhg_diapo_video_webm' => $media($f['webm'] ?? null),
			'field_snhg_diapo_video_mobile' => $media($f['mobile_mp4'] ?? null), 'field_snhg_diapo_video_mobile_webm' => $media($f['mobile_webm'] ?? null),
			'field_snhg_diapo_affiche' => $media($f['affiche'] ?? null), 'field_snhg_diapo_photo' => $media($f['photo'] ?? null),
			'field_snhg_diapo_boutons' => array_map(fn($b) => [
				'field_snhg_diapo_bouton_lien' => ['url' => $liens($b['lien']), 'title' => $b['texte'], 'target' => ''],
				'field_snhg_diapo_bouton_style' => $b['style'],
			], $d['boutons']),
		]);
		$diapos[$d['cle']][$d['langue']] = $id;
	}
	foreach ($diapos as $t) if (count($t) > 1) pll_save_post_translations($t);
	$bilan['diapositives'] = count($c['diapositives']);

	// Stations Gab'Oil (mêmes fiches dans les deux langues)
	foreach ($c['stations'] as $s) {
		$id = snhg_enregistrer('snhg_station', "station:{$s['cle']}", ['post_title' => $s['nom'], 'post_name' => $s['cle'], 'menu_order' => $s['ordre']]);
		snhg_remplir($id, [
			'field_snhg_station_ville' => $s['ville'], 'field_snhg_station_province' => $s['province'], 'field_snhg_station_etat' => $s['etat'],
			'field_snhg_station_latitude' => $s['lat'], 'field_snhg_station_longitude' => $s['lon'],
			'field_snhg_station_provisoire' => $s['provisoire'] ? 1 : 0, 'field_snhg_station_photo' => $media($s['photo']),
		]);
	}
	$bilan['stations'] = count($c['stations']);

	// Galeries de la médiathèque et portraits GO’TALK, dans chaque langue
	$groupes = [];
	foreach ($c['galeries'] as $g) {
		$id = snhg_enregistrer('snhg_galerie', "{$g['langue']}:{$g['cle']}", ['post_title' => $g['titre'], 'post_name' => "{$g['cle']}-{$g['langue']}", 'menu_order' => $g['ordre']]);
		pll_set_post_language($id, $g['langue']);
		snhg_remplir($id, [
			'field_snhg_galerie_type' => $g['type'], 'field_snhg_galerie_ancre' => $g['cle'], 'field_snhg_galerie_description' => $g['description'],
			'field_snhg_galerie_photos' => array_map(fn($p) => ['field_snhg_galerie_photo' => $media($p['fichier']), 'field_snhg_galerie_photo_alt' => $p['alt']], $g['photos']),
		]);
		$groupes['galerie:' . $g['cle']][$g['langue']] = $id;
	}
	foreach ($c['talents'] as $t) {
		$id = snhg_enregistrer('snhg_talent', "{$t['langue']}:{$t['cle']}", ['post_title' => $t['nom'] ?: $t['fonction'], 'post_name' => "{$t['cle']}-{$t['langue']}", 'menu_order' => $t['ordre']]);
		pll_set_post_language($id, $t['langue']);
		snhg_remplir($id, [
			'field_snhg_talent_identifiant' => $t['cle'], 'field_snhg_talent_nom' => $t['nom'], 'field_snhg_talent_fonction' => $t['fonction'],
			'field_snhg_talent_service' => $t['service'], 'field_snhg_talent_photo' => $media($t['photo']), 'field_snhg_talent_alt' => $t['alt'],
			'field_snhg_talent_titre' => $t['titre'], 'field_snhg_talent_chapo' => $t['chapo'],
			'field_snhg_talent_entretien' => array_map(fn($q) => ['field_snhg_talent_question' => $q['question'], 'field_snhg_talent_accroche' => $q['accroche'], 'field_snhg_talent_reponse' => $q['reponse']], $t['entretien']),
			'field_snhg_talent_mots' => array_map(fn($m) => ['field_snhg_talent_mot_libelle' => $m['libelle'], 'field_snhg_talent_mot_texte' => $m['texte']], $t['mots']),
		]);
		$groupes['talent:' . $t['cle']][$t['langue']] = $id;
	}
	foreach ($groupes as $t) if (count($t) > 1) pll_save_post_translations($t);
	$bilan['galeries'] = count($c['galeries']);
	$bilan['portraits'] = count($c['talents']);

	// Réglages du site : accueil, adresses des articles, fuseau horaire, page de confidentialité
	update_option('show_on_front', 'page');
	update_option('page_on_front', $pages['fr:index.html']);
	update_option('page_for_posts', 0);
	update_option('wp_page_for_privacy_policy', $pages['fr:informations-legales/confidentialite.html'] ?? 0);
	update_option('blogname', 'SNHG – Gabon Oil Company');
	update_option('blogdescription', 'Société Nationale des Hydrocarbures du Gabon');
	update_option('timezone_string', 'Africa/Libreville');
	update_option('date_format', 'j F Y');
	update_option('permalink_structure', '/actualites/%postname%/');
	update_option('category_base', 'actualites/categorie');

	snhg_importer_menus($c, $pages, $articles);
	PLL()->options->set('post_types', ['snhg_diapositive', 'snhg_galerie', 'snhg_talent']);
	PLL()->options->save();

	// Contenus d'exemple de WordPress, remplacés par ceux du site
	foreach (['post' => ['hello-world', 'bonjour-tout-le-monde'], 'page' => ['sample-page', 'page-d-exemple', 'politique-de-confidentialite']] as $type => $slugs) {
		foreach (get_posts(['post_type' => $type, 'post_status' => ['publish', 'draft'], 'post_name__in' => $slugs, 'posts_per_page' => -1, 'lang' => '', 'suppress_filters' => true]) as $p) {
			if (!get_post_meta($p->ID, '_snhg_cle', true)) wp_trash_post($p->ID);
		}
	}
	wp_defer_term_counting(false);
	// Polylang garde en cache l'accueil de chaque langue (/en/ pour l'accueil anglais) : il doit voir le nouveau
	PLL()->model->clean_languages_cache();
	flush_rewrite_rules();
	return $bilan;
}

/* Menus : un menu principal et un menu des liens légaux par langue, recréés à chaque import (et seuls, par l'étape
   « menus », après l'ajout d'une page au menu dans les sources) */
function snhg_importer_menus(array $c, array $pages, array $articles): void {
	$liens = fn(string $html) => snhg_resoudre_liens($html, $pages, $articles);
	$emplacements = [];
	foreach ($c['menus'] as $langue => $menus) {
		$adresse = fn($l) => $liens($l['lien']) . ($l['ancre'] !== '' ? '#' . $l['ancre'] : '');
		$element = function (int $menu, array $l, int $parent = 0, array $plus = []) use ($liens, $adresse, $pages, $langue) {
			$cle = preg_match('/^\{\{page:[a-z]+:(.+)\}\}$/', $l['lien'], $m) ? "$langue:{$m[1]}" : '';
			$donnees = ['menu-item-title' => $l['titre'], 'menu-item-status' => 'publish', 'menu-item-parent-id' => $parent,
				'menu-item-classes' => !empty($l['accent']) ? 'nav-accent' : ''] + $plus;
			if ($cle && isset($pages[$cle]) && $l['ancre'] === '') {
				$donnees += ['menu-item-type' => 'post_type', 'menu-item-object' => 'page', 'menu-item-object-id' => $pages[$cle]];
			} else {
				$donnees += ['menu-item-type' => 'custom', 'menu-item-url' => $adresse($l)];
			}
			$id = wp_update_nav_menu_item($menu, 0, $donnees);
			if (is_wp_error($id)) throw new RuntimeException('menu : ' . $id->get_error_message());
			return $id;
		};
		foreach (['principal' => 'Menu principal', 'legal' => 'Liens légaux'] as $emplacement => $nom) {
			$nom = "$nom (" . strtoupper($langue) . ')';
			$objet = wp_get_nav_menu_object($nom);
			$menu = $objet ? $objet->term_id : wp_create_nav_menu($nom);
			foreach (wp_get_nav_menu_items($menu, ['post_status' => 'any']) ?: [] as $ancien) wp_delete_post($ancien->ID, true);
			foreach ($menus[$emplacement] as $e) {
				if (($e['type'] ?? '') === 'groupe') {
					$groupe = wp_update_nav_menu_item($menu, 0, ['menu-item-title' => $e['titre'], 'menu-item-type' => 'custom', 'menu-item-url' => '#',
						'menu-item-status' => 'publish', 'menu-item-description' => $e['pied'],
						'menu-item-classes' => 'onglet-' . $e['id'] . ($e['directs_au_pied'] ? ' pied-directs' : '')]);
					foreach ($e['liens'] as $l) $element($menu, $l, $groupe);
				} else {
					$element($menu, $e);
				}
			}
			$emplacements[$emplacement][$langue] = $menu;
		}
	}
	set_theme_mod('nav_menu_locations', array_map(fn($par_langue) => $par_langue['fr'], $emplacements));
	PLL()->options->set('nav_menus', [get_stylesheet() => $emplacements]);
	PLL()->options->save();
}
