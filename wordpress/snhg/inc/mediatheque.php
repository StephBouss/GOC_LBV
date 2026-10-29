<?php
/**
 * Médiathèque : les « Galeries » de l'administration (une par site, traduites avec Polylang), mises en forme comme
 * dans scripts/mediatheque.js ; la visionneuse <dialog> de la page les affiche photo par photo (app.js).
 *
 *  [snhg_mediatheque vue="sommaire"]   liens vers chaque galerie, avec son nombre de photos
 *  [snhg_mediatheque vue="galeries"]   une section par galerie : sur-titre, titre, texte, mosaïque de photos
 *  [snhg_mediatheque nombre="galeries"] / [snhg_mediatheque nombre="photos"]   nombres de galeries et de photos
 *
 * Une galerie est repérée par son identifiant (champ « Identifiant », le même dans les deux langues) : #sardine.
 */
defined('ABSPATH') || exit;

add_action('init', function () {
	register_post_type('snhg_galerie', [
		'labels' => [
			'name' => 'Galeries de la médiathèque',
			'singular_name' => 'Galerie',
			'menu_name' => 'Médiathèque (galeries)',
			'all_items' => 'Toutes les galeries',
			'add_new' => 'Ajouter',
			'add_new_item' => 'Ajouter une galerie',
			'edit_item' => 'Modifier la galerie',
			'new_item' => 'Nouvelle galerie',
			'search_items' => 'Rechercher une galerie',
			'not_found' => 'Aucune galerie',
		],
		'description' => 'Galeries de photos de la page Médiathèque, dans l\'ordre du champ « Ordre ».',
		'public' => false,
		'show_ui' => true,
		'show_in_rest' => false,
		'menu_position' => 23,
		'menu_icon' => 'dashicons-format-gallery',
		'supports' => ['title', 'page-attributes'],
	]);
});

add_filter('pll_get_post_types', function ($types, $reglages) {
	if (!$reglages) $types['snhg_galerie'] = 'snhg_galerie';
	return $types;
}, 10, 2);

add_action('acf/init', function () {
	acf_add_local_field_group([
		'key' => 'group_snhg_galerie',
		'title' => 'Galerie',
		'location' => [[['param' => 'post_type', 'operator' => '==', 'value' => 'snhg_galerie']]],
		'position' => 'acf_after_title',
		'style' => 'seamless',
		'fields' => [
			['key' => 'field_snhg_galerie_type', 'name' => 'type', 'label' => 'Sur-titre', 'type' => 'text', 'placeholder' => 'Champ offshore', 'wrapper' => ['width' => 50]],
			['key' => 'field_snhg_galerie_ancre', 'name' => 'ancre', 'label' => 'Identifiant', 'type' => 'text', 'wrapper' => ['width' => 50],
				'instructions' => "Adresse de la galerie dans la page (#sardine) : en minuscules, sans espace ni accent, le même dans les deux langues."],
			['key' => 'field_snhg_galerie_description', 'name' => 'description', 'label' => 'Texte', 'type' => 'textarea', 'rows' => 3, 'new_lines' => ''],
			['key' => 'field_snhg_galerie_photos', 'name' => 'photos', 'label' => 'Photos', 'type' => 'repeater', 'layout' => 'table', 'button_label' => 'Ajouter une photo',
				'instructions' => 'La première photo est la plus grande de la mosaïque. Format conseillé : 1600 px de large.', 'sub_fields' => [
					['key' => 'field_snhg_galerie_photo', 'name' => 'photo', 'label' => 'Photo', 'type' => 'image', 'return_format' => 'id', 'preview_size' => 'thumbnail', 'required' => 1],
					['key' => 'field_snhg_galerie_photo_alt', 'name' => 'texte_alternatif', 'label' => 'Ce que montre la photo', 'type' => 'text',
						'instructions' => 'Dans la langue de la galerie (sinon le texte alternatif de la médiathèque).'],
				]],
		],
	]);
});

function snhg_galeries(): array {
	static $galeries = null;
	if ($galeries !== null) return $galeries;
	$galeries = [];
	foreach (get_posts(['post_type' => 'snhg_galerie', 'post_status' => 'publish', 'posts_per_page' => -1,
		'orderby' => ['menu_order' => 'ASC', 'date' => 'ASC'], 'lang' => snhg_langue(), 'no_found_rows' => true]) as $g) {
		$photos = array_values(array_filter((array) snhg_champ('photos', $g->ID), fn($p) => !empty($p['photo'])));
		$galeries[] = [
			'ancre' => snhg_champ('ancre', $g->ID) ?: $g->post_name,
			'titre' => get_the_title($g),
			'type' => (string) snhg_champ('type', $g->ID),
			'description' => (string) snhg_champ('description', $g->ID),
			'photos' => $photos,
		];
	}
	return $galeries;
}

function snhg_sommaire_galeries(): string {
	return "<ul>\n" . implode("\n", array_map(fn($g) => '          <li><a href="#' . esc_attr($g['ancre']) . '">' . esc_html($g['titre'])
		. ' <span class="filtre-nombre">' . count($g['photos']) . '<span class="visuellement-masque"> ' . esc_html(snhg_t('photos')) . '</span></span></a></li>', snhg_galeries()))
		. "\n        </ul>";
}

/* Photo de la mosaïque : lien vers la grande image (ouverte telle quelle sans JavaScript, dans la visionneuse sinon) */
function snhg_photo_galerie(array $g, array $p, int $i): string {
	$id = (int) $p['photo'];
	$grande = wp_get_attachment_image_src($id, 'full');
	$petite = wp_get_attachment_image_src($id, 'medium_large') ?: $grande;
	if (!$grande) return '';
	$alt = $p['texte_alternatif'] ?: get_post_meta($id, '_wp_attachment_image_alt', true);
	$tailles = $i === 0 ? '(max-width: 767px) 100vw, 60vw' : '(max-width: 767px) 50vw, 30vw';
	return '          <li><a class="galerie-photo" href="' . esc_url($grande[0]) . '" data-visionneuse="' . esc_attr($g['ancre']) . '" data-largeur="' . (int) $grande[1] . '" data-hauteur="' . (int) $grande[2] . '">'
		. '<img src="' . esc_url($petite[0]) . '" srcset="' . esc_attr((string) wp_get_attachment_image_srcset($id, 'full')) . '" sizes="' . $tailles . '" alt="' . snhg_attribut($alt) . '" width="' . (int) $petite[1] . '" height="' . (int) $petite[2] . '" loading="lazy"></a></li>';
}

function snhg_section_galerie(array $g, int $rang): string {
	$n = count($g['photos']);
	$ancre = esc_attr($g['ancre']);
	return '
  <!-- Galerie : ' . esc_html($g['titre']) . ' -->
  <section class="section galerie' . ($rang % 2 ? '' : ' fond-surface') . '" id="' . $ancre . '" aria-labelledby="galerie-' . $ancre . '">
    <div class="conteneur">
      <div class="galerie-tete" data-apparition>
        <div>
          <p class="sur-titre">' . esc_html($g['type']) . '</p>
          <h2 class="titre-section" id="galerie-' . $ancre . '">' . esc_html($g['titre']) . '</h2>
        </div>
        <p class="galerie-texte">' . esc_html($g['description']) . ' <span class="galerie-nombre">' . $n . ' ' . esc_html($n > 1 ? snhg_t('photos') : snhg_t('photo')) . '</span></p>
      </div>
      <ul class="galerie-grille" data-nombre="' . $n . '" data-cascade>
' . implode("\n", array_map(fn($p, $i) => snhg_photo_galerie($g, $p, $i), $g['photos'], array_keys($g['photos']))) . '
      </ul>
    </div>
  </section>';
}

add_shortcode('snhg_mediatheque', function ($attributs) {
	$a = shortcode_atts(['vue' => '', 'nombre' => ''], $attributs);
	if ($a['nombre'] === 'galeries') return (string) count(snhg_galeries());
	if ($a['nombre'] === 'photos') return (string) array_sum(array_map(fn($g) => count($g['photos']), snhg_galeries()));
	if ($a['vue'] === 'sommaire') return snhg_sommaire_galeries();
	if ($a['vue'] === 'galeries') return implode("\n", array_map('snhg_section_galerie', snhg_galeries(), array_keys(snhg_galeries())));
	return '';
});
