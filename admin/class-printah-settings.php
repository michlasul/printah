<?php
/**
 * Settings for the Printah admin experience.
 *
 * @package Printah
 */

namespace Printah\Admin;

use Printah\Printah_Loader;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Stores site-wide palette and toolbar preferences. */
final class Printah_Settings {
	const OPTION = 'printah_settings';

	/**
	 * Plugin hook loader instance.
	 *
	 * @var Printah_Loader
	 */
	private $loader;

	/**
	 * Initialize settings handler.
	 *
	 * @param Printah_Loader|null $loader Optional plugin hook loader.
	 */
	public function __construct( ?Printah_Loader $loader = null ) {
		$this->loader = $loader ? $loader : new Printah_Loader();
	}

	/** Get saved values with defaults. */
	public static function get(): array {
		$saved = get_option( self::OPTION, array() );
		return wp_parse_args(
			is_array( $saved ) ? $saved : array(),
			array(
				'printah_shortcut'       => 'mod+k',
				'native_palette_enabled' => false,
				'native_shortcut'        => 'mod+j',
				'hide_toolbar'           => true,
			)
		);
	}

	/** Register the option with the Settings API. */
	public function register(): void {
		register_setting(
			'printah_settings',
			self::OPTION,
			array(
				'type'              => 'array',
				'sanitize_callback' => array( $this, 'sanitize' ),
				'default'           => self::get(),
			)
		);
	}

	/**
	 * Validate submitted settings.
	 *
	 * @param mixed $input Form input.
	 * @return array Sanitized option.
	 */
	public function sanitize( $input ): array {
		$previous = self::get();
		$input    = is_array( $input ) ? $input : array();
		$allowed  = array( 'mod+k', 'mod+j', 'mod+shift+k', 'mod+shift+j' );
		$printah  = isset( $input['printah_shortcut'] ) ? sanitize_text_field( $input['printah_shortcut'] ) : '';
		$native   = isset( $input['native_shortcut'] ) ? sanitize_text_field( $input['native_shortcut'] ) : '';

		if ( ! in_array( $printah, $allowed, true ) || ! in_array( $native, $allowed, true ) || $printah === $native ) {
			add_settings_error( self::OPTION, 'invalid_shortcut', __( 'Choose two different shortcuts from the available options.', 'printah' ) );
			$printah = $previous['printah_shortcut'];
			$native  = $previous['native_shortcut'];
		}

		return array(
			'printah_shortcut'       => $printah,
			'native_palette_enabled' => ! empty( $input['native_palette_enabled'] ),
			'native_shortcut'        => $native,
			'hide_toolbar'           => ! empty( $input['hide_toolbar'] ),
		);
	}

	/** Remove WordPress's native palette assets when disabled. */
	public function configure_native_palette(): void {
		if ( ! self::get()['native_palette_enabled'] ) {
			$this->loader->remove_action( 'admin_enqueue_scripts', 'wp_enqueue_command_palette_assets' );
		}
	}
}
