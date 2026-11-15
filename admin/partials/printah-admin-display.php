<?php
/**
 * Printah settings page.
 *
 * @package Printah
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$printah_settings  = \Printah\Admin\Printah_Settings::get();
$printah_shortcuts = array(
	'mod+k'       => '⌘/Ctrl + K',
	'mod+j'       => '⌘/Ctrl + J',
	'mod+shift+k' => '⌘/Ctrl + Shift + K',
	'mod+shift+j' => '⌘/Ctrl + Shift + J',
);
?>
<div class="wrap printah-settings">
	<div class="printah-settings__hero">
		<span class="printah-settings__eyebrow"><?php esc_html_e( 'PRINTAH · SETTINGS', 'printah' ); ?></span>
		<h1><?php esc_html_e( 'Quick control for WordPress.', 'printah' ); ?></h1>
		<p><?php esc_html_e( 'Configure how Printah opens, the WordPress Command Palette, and the admin toolbar.', 'printah' ); ?></p>
	</div>
	<?php settings_errors( \Printah\Admin\Printah_Settings::OPTION ); ?>
	<form method="post" action="options.php">
		<?php settings_fields( 'printah_settings' ); ?>
		<div class="printah-settings__grid">
			<section class="printah-settings__card">
				<h2><?php esc_html_e( 'Shortcuts', 'printah' ); ?></h2>
				<p><?php esc_html_e( 'Choose a different shortcut combination for each palette.', 'printah' ); ?></p>
				<label for="printah-shortcut"><?php esc_html_e( 'Open Printah', 'printah' ); ?></label>
				<select id="printah-shortcut" name="printah_settings[printah_shortcut]">
					<?php foreach ( $printah_shortcuts as $printah_value => $printah_label ) : ?>
						<option value="<?php echo esc_attr( $printah_value ); ?>" <?php selected( $printah_settings['printah_shortcut'], $printah_value ); ?>><?php echo esc_html( $printah_label ); ?></option>
					<?php endforeach; ?>
				</select>
				<label class="printah-settings__toggle" for="printah-native-enabled">
					<input id="printah-native-enabled" type="checkbox" name="printah_settings[native_palette_enabled]" value="1" <?php checked( $printah_settings['native_palette_enabled'] ); ?> />
					<span><?php esc_html_e( 'Enable WordPress Command Palette', 'printah' ); ?></span>
				</label>
				<label for="printah-native-shortcut"><?php esc_html_e( 'Open WordPress palette', 'printah' ); ?></label>
				<select id="printah-native-shortcut" name="printah_settings[native_shortcut]">
					<?php foreach ( $printah_shortcuts as $printah_value => $printah_label ) : ?>
						<option value="<?php echo esc_attr( $printah_value ); ?>" <?php selected( $printah_settings['native_shortcut'], $printah_value ); ?>><?php echo esc_html( $printah_label ); ?></option>
					<?php endforeach; ?>
				</select>
			</section>
			<section class="printah-settings__card">
				<h2><?php esc_html_e( 'Admin Interface', 'printah' ); ?></h2>
				<p><?php esc_html_e( 'The floating pill provides quick access to your site, comments, new content, and profile.', 'printah' ); ?></p>
				<label class="printah-settings__toggle" for="printah-hide-toolbar">
					<input id="printah-hide-toolbar" type="checkbox" name="printah_settings[hide_toolbar]" value="1" <?php checked( $printah_settings['hide_toolbar'] ); ?> />
					<span><?php esc_html_e( 'Hide the top admin toolbar once the pill is ready', 'printah' ); ?></span>
				</label>
				<p class="description"><?php esc_html_e( 'If Printah fails to load, the WordPress toolbar remains visible.', 'printah' ); ?></p>
			</section>
		</div>
		<?php submit_button( __( 'Save Settings', 'printah' ) ); ?>
	</form>
</div>
