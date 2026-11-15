<?php
/**
 * REST search for editable WordPress content.
 *
 * @package Printah
 */

namespace Printah;

use Printah\Admin\Printah_Settings;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Finds posts, pages, and accessible custom post types that the current user can edit.
 */
final class Printah_Search_Controller extends \WP_REST_Controller {

	/**
	 * Plugin hook loader instance.
	 *
	 * @var Printah_Loader
	 */
	private $loader;

	/**
	 * Set the REST namespace, route base, and hook loader.
	 *
	 * @param Printah_Loader|null $loader Optional plugin hook loader.
	 */
	public function __construct( ?Printah_Loader $loader = null ) {
		$this->namespace = 'printah/v1';
		$this->rest_base = 'search';
		$this->loader    = $loader ? $loader : new Printah_Loader();
	}

	/**
	 * Register the content search endpoint.
	 *
	 * @return void
	 */
	public function register_routes(): void {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_items' ),
				'permission_callback' => array( $this, 'get_items_permissions_check' ),
				'args'                => array(
					'q' => array(
						'required'          => true,
						'type'              => 'string',
						'minLength'         => 3,
						'maxLength'         => 100,
						'sanitize_callback' => 'sanitize_text_field',
						'validate_callback' => 'rest_validate_request_arg',
					),
				),
			)
		);
	}

	/**
	 * Restrict search to users who can edit at least one searchable post type.
	 *
	 * @param \WP_REST_Request $request REST request.
	 * @return bool
	 */
	public function get_items_permissions_check( $request ): bool {
		unset( $request );

		return ! empty( $this->get_editable_post_types() );
	}

	/**
	 * Return editable posts, pages, and custom post types as palette commands.
	 *
	 * @param \WP_REST_Request $request REST request.
	 * @return \WP_REST_Response|\WP_Error REST response.
	 */
	public function get_items( $request ) {
		$settings = Printah_Settings::get();

		if ( empty( $settings['content_search_enabled'] ) ) {
			return rest_ensure_response( array() );
		}

		$query_text = trim( sanitize_text_field( (string) $request->get_param( 'q' ) ) );

		if ( 3 > preg_match_all( '/./u', $query_text ) ) {
			return rest_ensure_response( array() );
		}

		$results    = array();
		$post_types = $this->get_editable_post_types();
		$per_type   = 2 < count( $post_types ) ? 5 : 8;

		foreach ( $post_types as $post_type => $post_type_object ) {
			$query = new \WP_Query(
				array(
					'post_type'              => $post_type,
					'post_status'            => array( 'publish', 'future', 'draft', 'pending', 'private' ),
					'posts_per_page'         => $per_type,
					's'                      => $query_text,
					'perm'                   => 'editable',
					'orderby'                => 'relevance',
					'ignore_sticky_posts'    => true,
					'no_found_rows'          => true,
					'update_post_meta_cache' => false,
					'update_post_term_cache' => false,
				)
			);

			foreach ( $query->posts as $post ) {
				if ( ! current_user_can( 'edit_post', $post->ID ) ) {
					continue;
				}

				$edit_url = get_edit_post_link( $post, 'raw' );

				if ( ! $edit_url ) {
					continue;
				}

				$status = get_post_status_object( $post->post_status );
				$title  = '' !== $post->post_title ? $post->post_title : __( '(no title)', 'printah' );

				$results[] = array(
					'id'          => 'content-' . $post->ID,
					'label'       => $title,
					'description' => $post_type_object->labels->singular_name . ' · ' . ( $status ? $status->label : $post->post_status ),
					'keywords'    => array(),
					'url'         => esc_url_raw( $edit_url ),
					'category'    => $this->get_category_for_post_type( $post_type ),
					'postType'    => $post_type,
					'actions'     => $this->get_actions( $post ),
				);

				if ( 16 <= count( $results ) ) {
					return rest_ensure_response( $results );
				}
			}
		}

		return rest_ensure_response( $results );
	}

	/**
	 * Resolve searchable public post types that the current user can edit.
	 *
	 * @return array<string, \WP_Post_Type> Map of post type slug to post type object.
	 */
	private function get_editable_post_types(): array {
		$registered = get_post_types(
			array(
				'public'  => true,
				'show_ui' => true,
			),
			'objects'
		);

		unset( $registered['attachment'] );

		$settings = Printah_Settings::get();
		if ( empty( $settings['module_woocommerce_enabled'] ) ) {
			unset( $registered['product'] );
		}
		if ( empty( $settings['module_elementor_enabled'] ) ) {
			unset( $registered['elementor_library'] );
		}

		$post_type_slugs = array_keys( $registered );

		/**
		 * Filters the post type slugs included in Printah dynamic content search.
		 *
		 * @param string[] $post_type_slugs Searchable post type slugs.
		 */
		$filtered_slugs = $this->loader->apply_filters( 'printah_search_post_types', $post_type_slugs );

		if ( ! is_array( $filtered_slugs ) ) {
			$filtered_slugs = $post_type_slugs;
		}

		$editable = array();

		foreach ( $filtered_slugs as $slug ) {
			if ( ! is_string( $slug ) || '' === $slug ) {
				continue;
			}

			$post_type_object = $registered[ $slug ] ?? get_post_type_object( $slug );

			if ( ! $post_type_object instanceof \WP_Post_Type ) {
				continue;
			}

			if ( empty( $post_type_object->cap->edit_posts ) || ! current_user_can( $post_type_object->cap->edit_posts ) ) {
				continue;
			}

			$editable[ $slug ] = $post_type_object;
		}

		return $editable;
	}

	/**
	 * Map a post type slug to a Printah palette category.
	 *
	 * @param string $post_type Post type slug.
	 * @return string
	 */
	private function get_category_for_post_type( string $post_type ): string {
		if ( 'product' === $post_type ) {
			return 'toko';
		}

		if ( 'elementor_library' === $post_type ) {
			return 'elementor';
		}

		return 'konten';
	}

	/**
	 * Build secondary actions available for a content item.
	 *
	 * @param \WP_Post $post Editable content item.
	 * @return array Secondary actions.
	 */
	private function get_actions( \WP_Post $post ): array {
		$actions = array();

		if ( 'publish' === $post->post_status && is_post_type_viewable( $post->post_type ) ) {
			$view_url = get_permalink( $post );

			if ( $view_url ) {
				$actions[] = array(
					'id'    => 'view',
					'label' => __( 'View on Site', 'printah' ),
					'url'   => esc_url_raw( $view_url ),
				);
			}
		}

		$settings = Printah_Settings::get();

		if (
			! empty( $settings['module_elementor_enabled'] ) &&
			did_action( 'elementor/loaded' ) &&
			class_exists( '\\Elementor\\Plugin' ) &&
			class_exists( '\\Elementor\\Utils' ) &&
			\Elementor\Utils::is_post_support( $post->ID )
		) {
			$document = \Elementor\Plugin::$instance->documents->get( $post->ID );

			if ( $document && $document->is_editable_by_current_user() ) {
				$elementor_url = $document->get_edit_url();

				if ( $elementor_url ) {
					$actions[] = array(
						'id'    => 'elementor',
						'label' => __( 'Edit with Elementor', 'printah' ),
						'url'   => esc_url_raw( $elementor_url ),
					);
				}
			}
		}

		return $actions;
	}
}
