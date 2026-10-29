<?php
/**
 * GO’TALK : les « Portraits GO’TALK » de l'administration (un par talent, traduits avec Polylang), mis en forme comme
 * dans scripts/gotalk.js.
 *
 *  [snhg_gotalk vue="talents"]    cartes des portraits (photo, nom, fonction)
 *  [snhg_gotalk vue="portraits"]  une fenêtre <dialog> par portrait, après le pied de page : entretien, « En quelques
 *                                 mots », portraits voisins ; ouverte par sa carte ou par l'adresse #<identifiant>
 *
 * Dans les textes, {en|texte} marque un passage dans une autre langue (<span lang="en">) et *texte* une mise en
 * italique. Textes de l'interface (Lire le portrait, Fermer…) : donnees/gotalk.json, dans chaque langue.
 */
defined('ABSPATH') || exit;

add_action('init', function () {
	register_post_type('snhg_talent', [
		'labels' => [
			'name' => 'Portraits GO’TALK',
			'singular_name' => 'Portrait',
			'menu_name' => 'GO’TALK',
			'all_items' => 'Tous les portraits',
			'add_new' => 'Ajouter',
			'add_new_item' => 'Ajouter un portrait',
			'edit_item' => 'Modifier le portrait',
			'new_item' => 'Nouveau portrait',
			'search_items' => 'Rechercher un portrait',
			'not_found' => 'Aucun portrait',
		],
		'description' => 'Portraits de talents de la page GO’TALK, dans l\'ordre du champ « Ordre ».',
		'public' => false,
		'show_ui' => true,
		'show_in_rest' => false,
		'menu_position' => 24,
		'menu_icon' => 'dashicons-format-quote',
		'supports' => ['title', 'page-attributes'],
	]);
});

add_filter('pll_get_post_types', function ($types, $reglages) {
	if (!$reglages) $types['snhg_talent'] = 'snhg_talent';
	return $types;
}, 10, 2);

add_action('acf/init', function () {
	$aide = 'Un passage dans une autre langue s\'écrit {en|texte}, une mise en italique *texte*.';
	acf_add_local_field_group([
		'key' => 'group_snhg_talent',
		'title' => 'Portrait',
		'location' => [[['param' => 'post_type', 'operator' => '==', 'value' => 'snhg_talent']]],
		'position' => 'acf_after_title',
		'style' => 'seamless',
		'instruction_placement' => 'field',
		'fields' => [
			['key' => 'field_snhg_talent_tab_identite', 'label' => 'Identité', 'type' => 'tab'],
			['key' => 'field_snhg_talent_identifiant', 'name' => 'identifiant', 'label' => 'Identifiant', 'type' => 'text',
				'instructions' => "Adresse du portrait (#prenom-nom) : en minuscules, sans espace ni accent, le même dans les deux langues."],
			['key' => 'field_snhg_talent_nom', 'name' => 'nom', 'label' => 'Nom', 'type' => 'text', 'wrapper' => ['width' => 34],
				'instructions' => 'Sans nom, la carte est titrée par la fonction.'],
			['key' => 'field_snhg_talent_fonction', 'name' => 'fonction', 'label' => 'Fonction', 'type' => 'text', 'required' => 1, 'wrapper' => ['width' => 33]],
			['key' => 'field_snhg_talent_service', 'name' => 'service', 'label' => 'Direction ou service', 'type' => 'text', 'required' => 1, 'wrapper' => ['width' => 33]],
			['key' => 'field_snhg_talent_photo', 'name' => 'photo', 'label' => 'Photo', 'type' => 'image', 'return_format' => 'id', 'preview_size' => 'medium', 'required' => 1,
				'instructions' => 'Portrait vertical, 960 × 1200 px.', 'wrapper' => ['width' => 34]],
			['key' => 'field_snhg_talent_alt', 'name' => 'texte_alternatif', 'label' => 'Ce que montre la photo', 'type' => 'text', 'wrapper' => ['width' => 66]],
			['key' => 'field_snhg_talent_tab_entretien', 'label' => 'Entretien', 'type' => 'tab'],
			['key' => 'field_snhg_talent_titre', 'name' => 'titre', 'label' => "Titre de l'entretien", 'type' => 'text', 'required' => 1, 'instructions' => $aide],
			['key' => 'field_snhg_talent_chapo', 'name' => 'chapo', 'label' => 'Chapô', 'type' => 'textarea', 'rows' => 4, 'new_lines' => '', 'required' => 1],
			['key' => 'field_snhg_talent_entretien', 'name' => 'entretien', 'label' => 'Questions et réponses', 'type' => 'repeater', 'layout' => 'block', 'button_label' => 'Ajouter une question', 'sub_fields' => [
				['key' => 'field_snhg_talent_question', 'name' => 'question', 'label' => 'Question', 'type' => 'text', 'required' => 1],
				['key' => 'field_snhg_talent_accroche', 'name' => 'accroche', 'label' => 'Accroche (facultative)', 'type' => 'text', 'instructions' => 'Phrase mise en avant avant la réponse.'],
				['key' => 'field_snhg_talent_reponse', 'name' => 'reponse', 'label' => 'Réponse', 'type' => 'textarea', 'rows' => 6, 'new_lines' => '', 'required' => 1,
					'instructions' => 'Une ligne vide sépare deux paragraphes. ' . $aide],
			]],
			['key' => 'field_snhg_talent_tab_mots', 'label' => 'En quelques mots', 'type' => 'tab'],
			['key' => 'field_snhg_talent_mots', 'name' => 'mots', 'label' => 'En quelques mots', 'type' => 'repeater', 'layout' => 'table', 'button_label' => 'Ajouter une ligne', 'sub_fields' => [
				['key' => 'field_snhg_talent_mot_libelle', 'name' => 'libelle', 'label' => 'Intitulé', 'type' => 'text', 'required' => 1],
				['key' => 'field_snhg_talent_mot_texte', 'name' => 'texte', 'label' => 'Réponse', 'type' => 'text', 'required' => 1],
			]],
		],
	]);
});

/* {en|texte} → <span lang="en">texte</span>, *texte* → <em>texte</em> (comme enrichir() de scripts/gotalk.js) */
function snhg_enrichir($texte): string {
	$html = esc_html((string) $texte);
	$html = preg_replace('/\{([a-z]{2})\|([^}]*)\}/', '<span lang="$1">$2</span>', $html);
	return preg_replace('/\*([^*]+)\*/', '<em>$1</em>', $html);
}

function snhg_texte_gotalk(string $cle): string {
	$d = snhg_donnees('gotalk');
	return ($d[snhg_langue()] ?? $d['fr'] ?? [])[$cle] ?? $cle;
}

function snhg_talents(): array {
	static $talents = null;
	if ($talents !== null) return $talents;
	$talents = [];
	foreach (get_posts(['post_type' => 'snhg_talent', 'post_status' => 'publish', 'posts_per_page' => -1,
		'orderby' => ['menu_order' => 'ASC', 'date' => 'ASC'], 'lang' => snhg_langue(), 'no_found_rows' => true]) as $p) {
		$t = ['id' => snhg_champ('identifiant', $p->ID) ?: $p->post_name];
		foreach (['nom', 'fonction', 'service', 'texte_alternatif', 'titre', 'chapo'] as $champ) $t[$champ] = (string) snhg_champ($champ, $p->ID);
		$t['photo'] = (int) snhg_champ('photo', $p->ID);
		$t['entretien'] = (array) snhg_champ('entretien', $p->ID);
		$t['mots'] = (array) snhg_champ('mots', $p->ID);
		// Titre de la carte et de la fenêtre : le nom, ou la fonction tant que le nom manque
		$t['titre_carte'] = $t['nom'] ?: $t['fonction'];
		$t['sous_titre'] = $t['nom'] ? $t['fonction'] : $t['service'];
		$talents[] = $t;
	}
	return $talents;
}

function snhg_image_talent(array $t, string $tailles, string $alt): string {
	$image = wp_get_attachment_image_src($t['photo'], 'full');
	if (!$image) return '';
	return '<img src="' . esc_url($image[0]) . '" srcset="' . esc_attr((string) wp_get_attachment_image_srcset($t['photo'], 'full')) . '" sizes="' . $tailles . '" alt="' . snhg_attribut($alt) . '" width="' . (int) $image[1] . '" height="' . (int) $image[2] . '" loading="lazy">';
}

function snhg_cartes_talents(): string {
	$cartes = array_map(fn($t) => '          <li>
            <button class="talent-carte" type="button" data-talent="' . esc_attr($t['id']) . '" aria-haspopup="dialog" aria-controls="talent-' . esc_attr($t['id']) . '">
              <span class="talent-carte-photo">' . snhg_image_talent($t, '(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 24rem', '') . '</span>
              <span class="talent-carte-bulle" aria-hidden="true">”</span>
              <span class="talent-carte-texte">
                <span class="talent-carte-nom">' . esc_html($t['titre_carte']) . '</span>
                <span class="talent-carte-fonction">' . esc_html($t['sous_titre']) . '</span>
                <span class="talent-carte-lire">' . esc_html(snhg_texte_gotalk('lire')) . ' <svg class="icone" aria-hidden="true"><use href="#i-fleche"/></svg></span>
              </span>
            </button>
          </li>', snhg_talents());
	return "<ul class=\"talents\" data-cascade>\n" . implode("\n", $cartes) . "\n        </ul>";
}

function snhg_portrait(array $t, int $i): string {
	$talents = snhg_talents();
	$n = count($talents);
	$voisin = function (int $sens, string $cle) use ($talents, $i, $n) {
		$v = $talents[($i + $sens + $n) % $n];
		return '<button class="talent-voisin talent-voisin-' . $cle . '" type="button" data-talent-voisin="' . esc_attr($v['id']) . '"><span class="talent-voisin-sens">' . esc_html(snhg_texte_gotalk($cle)) . '</span><span class="talent-voisin-nom">' . esc_html($v['titre_carte']) . '</span></button>';
	};
	$id = 'talent-' . esc_attr($t['id']);
	$echanges = array_map(function ($q) {
		$paragraphes = array_filter(array_map('trim', preg_split('/\R\s*\R/', (string) $q['reponse'])));
		return "        <section class=\"talent-echange\">\n          <h3>" . snhg_enrichir($q['question']) . "</h3>\n"
			. (!empty($q['accroche']) ? '          <p class="talent-accroche">' . snhg_enrichir($q['accroche']) . "</p>\n" : '')
			. implode("\n", array_map(fn($p) => '          <p>' . snhg_enrichir($p) . '</p>', $paragraphes)) . "\n        </section>";
	}, $t['entretien']);
	$mots = array_map(fn($m) => '            <div><dt>' . snhg_enrichir($m['libelle']) . '</dt><dd>' . snhg_enrichir($m['texte']) . '</dd></div>', $t['mots']);
	return '<dialog class="talent" id="' . $id . '" closedby="any" aria-labelledby="' . $id . '-titre">
  <div class="talent-cadre">
    <button class="talent-fermer" type="button" data-ferme aria-label="' . esc_attr(snhg_texte_gotalk('fermer')) . '"><svg class="icone" aria-hidden="true"><use href="#i-fermer"/></svg></button>
    <figure class="talent-portrait">
      ' . snhg_image_talent($t, '(max-width: 1023px) 100vw, 26rem', $t['texte_alternatif']) . '
      <figcaption class="talent-identite">
        <span class="talent-identite-nom">' . esc_html($t['titre_carte']) . '</span>
        ' . ($t['nom'] ? '<span class="talent-identite-fonction">' . esc_html($t['fonction']) . "</span>\n        " : '') . '<span class="talent-identite-service">' . esc_html($t['service']) . '</span>
      </figcaption>
    </figure>
    <div class="talent-lecture">
      <div class="talent-progression" aria-hidden="true"></div>
      <article class="talent-article">
        <header class="talent-tete">
          <p class="talent-rubrique"><span class="talent-marque">GO’TALK</span> ' . esc_html(snhg_texte_gotalk('rubrique')) . '</p>
          <h2 class="talent-titre" id="' . $id . '-titre">' . snhg_enrichir($t['titre']) . '</h2>
          <p class="talent-chapo">' . snhg_enrichir($t['chapo']) . '</p>
        </header>
' . implode("\n", $echanges) . '
        <section class="talent-mots" aria-labelledby="' . $id . '-mots">
          <h3 id="' . $id . '-mots">' . esc_html(snhg_texte_gotalk('mots')) . '</h3>
          <dl>
' . implode("\n", $mots) . '
          </dl>
        </section>
      </article>
' . ($n > 1 ? '      <nav class="talent-suite" aria-label="' . esc_attr(snhg_texte_gotalk('autres')) . "\">\n        " . $voisin(-1, 'precedent') . "\n        " . $voisin(1, 'suivant') . "\n      </nav>\n" : '') . '    </div>
  </div>
</dialog>';
}

add_shortcode('snhg_gotalk', function ($attributs) {
	$vue = shortcode_atts(['vue' => ''], $attributs)['vue'];
	if ($vue === 'talents') return snhg_cartes_talents();
	if ($vue === 'portraits') return implode("\n", array_map('snhg_portrait', snhg_talents(), array_keys(snhg_talents())));
	return '';
});
