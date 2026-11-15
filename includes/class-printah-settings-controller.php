<?php
/**
 * REST settings endpoint for Printah.
 *
 * @package Printah
 */

namespace Printah;

use Printah\Admin\Printah_Settings;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Exposes Printah settings over the WordPress REST API for admin consumers.
 */
final class Printah_Settings_Controller extends \WP_REST_Controller {

	/**
	 * Settings service used for validation and persistence.
	 *
	 * @var Printah_Settings
	 */
	private $settings;

	/**
	 * Set the REST namespace, route base, and settings handler.
	 *
	 * @param Printah_Settings|null $settings Settings handler instance.
	 */
	public function __construct( ?Printah_Settings $settings = null ) {
		$this->namespace = 'printah/v1';
		$this->rest_base = 'settings';
		$this->settings  = $settings ? $settings : new Printah_Settings();
	}

	/**
	 * Register REST routes for reading and updating Printah settings.
	 *
	 * @return void
	 */
	public function register_routes(): void {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'permissions_check' ),
				),
				array(
					'methods'             => \WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'permissions_check' ),
					'args'                => $this->get_endpoint_args_for_item_schema( \WP_REST_Server::EDITABLE ),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Verify that the current user can manage plugin settings.
	 *
	 * @param \WP_REST_Request $request Incoming REST request.
	 * @return bool True when authorized.
	 */
	public function permissions_check( $request ): bool {
		unset( $request );
		return current_user_can( 'manage_options' );
	}

	/**
	 * Return sanitized Printah settings.
	 *
	 * @param \WP_REST_Request $request Incoming REST request.
	 * @return \WP_REST_Response Response containing current settings.
	 */
	public function get_item( $request ) {
		unset( $request );
		return rest_ensure_response( Printah_Settings::get() );
	}

	/**
	 * Validate and persist updated Printah settings.
	 *
	 * @param \WP_REST_Request $request Incoming REST request.
	 * @return \WP_REST_Response|\WP_Error Saved settings or validation error.
	 */
	public function update_item( $request ) {
		$current = Printah_Settings::get();
		$params  = $request->get_json_params();
		if ( ! is_array( $params ) || empty( $params ) ) {
			$params = $request->get_body_params();
		}
		if ( ! is_array( $params ) ) {
			$params = array();
		}

		$merged = array_merge( $current, $params );

		$allowed = array( 'mod+k', 'mod+j', 'mod+shift+k', 'mod+shift+j' );
		$printah = isset( $merged['printah_shortcut'] ) ? sanitize_text_field( (string) $merged['printah_shortcut'] ) : '';
		$native  = isset( $merged['native_shortcut'] ) ? sanitize_text_field( (string) $merged['native_shortcut'] ) : '';

		if ( ! in_array( $printah, $allowed, true ) || ! in_array( $native, $allowed, true ) || $printah === $native ) {
			return new \WP_Error(
				'printah_invalid_shortcut',
				__( 'Choose two different shortcuts from the available options.', 'printah' ),
				array( 'status' => 400 )
			);
		}

		$hide_toolbar       = ! empty( $merged['hide_toolbar'] );
		$show_floating_pill = ! empty( $merged['show_floating_pill'] );

		if ( ! $show_floating_pill && $hide_toolbar ) {
			return new \WP_Error(
				'printah_pill_toolbar_conflict',
				__( 'Keep either the floating pill or the WordPress admin toolbar visible so quick navigation stays accessible.', 'printah' ),
				array( 'status' => 400 )
			);
		}

		$sanitized = $this->settings->sanitize( $merged );
		update_option( Printah_Settings::OPTION, $sanitized );

		return rest_ensure_response( Printah_Settings::get() );
	}

	/**
	 * Define the settings JSON schema.
	 *
	 * @return array<string, mixed> Settings item schema.
	 */
	public function get_item_schema(): array {
		return array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'printah_settings',
			'type'       => 'object',
			'properties' => array(
				'printah_shortcut'           => array(
					'type' => 'string',
					'enum' => array( 'mod+k', 'mod+j', 'mod+shift+k', 'mod+shift+j' ),
				),
				'native_palette_enabled'     => array(
					'type' => 'boolean',
				),
				'native_shortcut'            => array(
					'type' => 'string',
					'enum' => array( 'mod+k', 'mod+j', 'mod+shift+k', 'mod+shift+j' ),
				),
				'hide_toolbar'               => array(
					'type' => 'boolean',
				),
				'show_floating_pill'         => array(
					'type' => 'boolean',
				),
				'content_search_enabled'     => array(
					'type' => 'boolean',
				),
				'module_elementor_enabled'   => array(
					'type' => 'boolean',
				),
				'module_woocommerce_enabled' => array(
					'type' => 'boolean',
				),
			),
		);
	}
}
