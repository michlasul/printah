<?php
/**
 * List of commands in Printah.
 *
 * @package Printah
 */

namespace Printah\Admin;

use Printah\Printah_Loader;

/**
 * Manages the list of available commands for the current user.
 */
final class Printah_Commands {

	/**
	 * Array of registered commands.
	 *
	 * @var array
	 */
	protected $commands = array();

	/**
	 * Plugin hook loader instance.
	 *
	 * @var Printah_Loader
	 */
	private $loader;

	/**
	 * Whether command provider callbacks have been registered on the loader.
	 *
	 * @var bool
	 */
	private $hooks_registered = false;

	/**
	 * Initialize the commands manager.
	 *
	 * @param Printah_Loader|null $loader Optional plugin hook loader.
	 */
	public function __construct( ?Printah_Loader $loader = null ) {
		$this->loader = $loader ? $loader : new Printah_Loader();
	}

	/**
	 * Register built-in command providers on the Printah hook loader.
	 *
	 * @param Printah_Loader $loader Plugin hook loader.
	 * @return void
	 */
	public function register_hooks( Printah_Loader $loader ): void {
		$this->loader = $loader;

		$loader->add_filter( 'printah_commands', $this, 'register_elementor_editor_commands', 5, 2 );
		$loader->add_filter( 'printah_commands', $this, 'register_editor_context_commands', 6, 2 );
		$loader->add_filter( 'printah_commands', $this, 'register_core_commands', 10, 1 );
		$loader->add_filter( 'printah_commands', $this, 'register_elementor_commands', 20, 1 );
		$loader->add_filter( 'printah_commands', $this, 'register_woocommerce_commands', 30, 1 );

		$this->hooks_registered = true;
	}

	/**
	 * Build the list of commands for the current user.
	 *
	 * @param array $context Optional active screen context.
	 * @return void
	 */
	protected function set_commands( array $context = array() ): void {
		$commands = $this->hooks_registered
			? array()
			: array_merge(
				$this->get_elementor_editor_commands( $context ),
				$this->get_editor_context_commands( $context ),
				$this->get_core_commands(),
				$this->get_elementor_commands(),
				$this->get_woocommerce_commands()
			);

		/**
		 * Filters the list of static commands registered in Printah.
		 *
		 * Third-party providers can append or modify command entries. Each entry
		 * may include an optional 'capability' key (string or string[]) which
		 * Printah checks via current_user_can() before exposing it to the UI.
		 *
		 * @param array $commands List of command definitions.
		 * @param array $context  Optional active screen context.
		 */
		$filtered = $this->loader->apply_filters( 'printah_commands', $commands, $context );

		if ( ! is_array( $filtered ) ) {
			$filtered = $commands;
		}

		$this->commands = $this->filter_commands_for_current_user( $filtered );
	}

	/**
	 * Prepend contextual Elementor editor commands via the printah_commands filter.
	 *
	 * @param array $commands Existing command definitions.
	 * @param array $context  Active screen context.
	 * @return array
	 */
	public function register_elementor_editor_commands( array $commands, array $context = array() ): array {
		return array_merge( $this->get_elementor_editor_commands( $context ), $commands );
	}

	/**
	 * Prepend contextual Block Editor and Site Editor commands via the printah_commands filter.
	 *
	 * @param array $commands Existing command definitions.
	 * @param array $context  Active screen context.
	 * @return array
	 */
	public function register_editor_context_commands( array $commands, array $context = array() ): array {
		return array_merge( $this->get_editor_context_commands( $context ), $commands );
	}

	/**
	 * Append WordPress core commands via the printah_commands filter.
	 *
	 * @param array $commands Existing command definitions.
	 * @return array
	 */
	public function register_core_commands( array $commands ): array {
		return array_merge( $commands, $this->get_core_commands() );
	}

	/**
	 * Append Elementor commands via the printah_commands filter.
	 *
	 * @param array $commands Existing command definitions.
	 * @return array
	 */
	public function register_elementor_commands( array $commands ): array {
		return array_merge( $commands, $this->get_elementor_commands() );
	}

	/**
	 * Append WooCommerce commands via the printah_commands filter.
	 *
	 * @param array $commands Existing command definitions.
	 * @return array
	 */
	public function register_woocommerce_commands( array $commands ): array {
		return array_merge( $commands, $this->get_woocommerce_commands() );
	}

	/**
	 * Returns all active commands for the current user.
	 *
	 * @param array $context Optional active screen context.
	 * @return array
	 */
	public function get_commands( array $context = array() ): array {
		$this->set_commands( $context );
		return $this->commands;
	}

	/**
	 * Returns contextual commands when Printah runs inside the Elementor editor.
	 *
	 * @param array $context Active screen context.
	 * @return array
	 */
	private function get_elementor_editor_commands( array $context ): array {
		if ( 'elementor-editor' !== ( $context['screen'] ?? '' ) ) {
			return array();
		}

		$commands = array();
		$post_id  = absint( $context['postId'] ?? 0 );
		$post     = $post_id ? get_post( $post_id ) : null;

		if ( $post instanceof \WP_Post ) {
			$is_published = ( 'publish' === $post->post_status );
			$view_url     = $is_published ? get_permalink( $post ) : get_preview_post_link( $post );
			$post_title   = '' !== $post->post_title ? $post->post_title : __( '(no title)', 'printah' );

			if ( $view_url && ( $is_published || current_user_can( 'edit_post', $post->ID ) ) ) {
				$commands[] = array(
					'id'          => 'elementor-view-live',
					'label'       => $is_published ? __( 'View Live Page', 'printah' ) : __( 'Preview Page', 'printah' ),
					'description' => sprintf(
						/* translators: %s: current post or page title. */
						__( 'Open "%s" on the site', 'printah' ),
						$post_title
					),
					'keywords'    => array( 'view', 'live', 'preview', 'site', 'frontend', 'elementor' ),
					'url'         => esc_url_raw( $view_url ),
					'category'    => 'elementor',
					'capability'  => 'read',
				);
			}

			$edit_url = get_edit_post_link( $post->ID, 'raw' );

			if ( $edit_url && current_user_can( 'edit_post', $post->ID ) ) {
				$commands[] = array(
					'id'          => 'elementor-exit-to-editor',
					'label'       => __( 'Edit in WordPress Editor', 'printah' ),
					'description' => __( 'Exit Elementor and open this content in WordPress', 'printah' ),
					'keywords'    => array( 'exit', 'wordpress', 'gutenberg', 'block editor', 'classic editor', 'back' ),
					'url'         => esc_url_raw( $edit_url ),
					'category'    => 'elementor',
					'capability'  => 'read',
				);
			}

			$type_object = get_post_type_object( $post->post_type );

			if (
				$type_object instanceof \WP_Post_Type &&
				$type_object->show_ui &&
				'elementor_library' !== $post->post_type &&
				! empty( $type_object->cap->edit_posts )
			) {
				$commands[] = array(
					'id'          => 'elementor-all-posts',
					'label'       => sprintf(
						/* translators: %s: plural post type name. */
						__( 'All %s', 'printah' ),
						$type_object->labels->name
					),
					'description' => __( 'Exit Elementor to the content list', 'printah' ),
					'keywords'    => array( 'all', 'list', 'pages', 'posts', 'exit', strtolower( $type_object->labels->name ) ),
					'url'         => admin_url( 'edit.php' . ( 'post' === $post->post_type ? '' : '?post_type=' . $post->post_type ) ),
					'category'    => 'elementor',
					'capability'  => $type_object->cap->edit_posts,
				);
			}
		}

		$commands[] = array(
			'id'          => 'elementor-exit-dashboard',
			'label'       => __( 'Exit to WordPress Dashboard', 'printah' ),
			'description' => __( 'Leave Elementor and return to the WP Admin dashboard', 'printah' ),
			'keywords'    => array( 'exit', 'dashboard', 'home', 'admin', 'leave', 'wordpress' ),
			'url'         => admin_url(),
			'category'    => 'elementor',
			'capability'  => 'read',
		);

		return $commands;
	}

	/**
	 * Returns contextual commands when Printah runs inside the Block Editor or Site Editor.
	 *
	 * @param array $context Active screen context.
	 * @return array
	 */
	private function get_editor_context_commands( array $context ): array {
		$screen = $context['screen'] ?? '';

		if ( 'site-editor' === $screen ) {
			return array(
				array(
					'id'          => 'site-editor-pages',
					'label'       => __( 'Manage Pages', 'printah' ),
					'description' => __( 'Exit Site Editor and open Pages list', 'printah' ),
					'keywords'    => array( 'site editor', 'pages', 'list', 'exit' ),
					'url'         => admin_url( 'edit.php?post_type=page' ),
					'category'    => 'konten',
					'capability'  => 'edit_pages',
				),
				array(
					'id'          => 'site-editor-themes',
					'label'       => __( 'Switch Themes', 'printah' ),
					'description' => __( 'Exit Site Editor and manage installed themes', 'printah' ),
					'keywords'    => array( 'site editor', 'themes', 'appearance', 'exit' ),
					'url'         => admin_url( 'themes.php' ),
					'category'    => 'tampilan',
					'capability'  => 'switch_themes',
				),
				array(
					'id'          => 'site-editor-dashboard',
					'label'       => __( 'Back to Dashboard', 'printah' ),
					'description' => __( 'Leave the Site Editor and return to WP Admin', 'printah' ),
					'keywords'    => array( 'site editor', 'dashboard', 'exit', 'home', 'admin' ),
					'url'         => admin_url(),
					'category'    => 'utama',
					'capability'  => 'read',
				),
			);
		}

		if ( 'block-editor' !== $screen ) {
			return array();
		}

		$commands  = array();
		$post_id   = absint( $context['postId'] ?? 0 );
		$post      = $post_id ? get_post( $post_id ) : null;
		$post_type = is_string( $context['postType'] ?? null ) ? sanitize_key( $context['postType'] ) : '';

		if ( $post instanceof \WP_Post ) {
			$post_type    = $post->post_type;
			$is_published = ( 'publish' === $post->post_status );
			$view_url     = $is_published ? get_permalink( $post ) : get_preview_post_link( $post );
			$post_title   = '' !== $post->post_title ? $post->post_title : __( '(no title)', 'printah' );

			if ( $view_url && ( $is_published || current_user_can( 'edit_post', $post->ID ) ) ) {
				$commands[] = array(
					'id'          => 'block-editor-view-live',
					'label'       => $is_published ? __( 'View Live Content', 'printah' ) : __( 'Preview Content', 'printah' ),
					'description' => sprintf(
						/* translators: %s: current post or page title. */
						__( 'Open "%s" on the site', 'printah' ),
						$post_title
					),
					'keywords'    => array( 'view', 'live', 'preview', 'site', 'gutenberg', 'block editor' ),
					'url'         => esc_url_raw( $view_url ),
					'category'    => 'konten',
					'capability'  => 'read',
				);
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
						$commands[] = array(
							'id'          => 'block-editor-edit-elementor',
							'label'       => __( 'Edit with Elementor', 'printah' ),
							'description' => __( 'Switch from Block Editor to Elementor canvas', 'printah' ),
							'keywords'    => array( 'elementor', 'edit with elementor', 'builder', 'switch' ),
							'url'         => esc_url_raw( $elementor_url ),
							'category'    => 'elementor',
							'capability'  => 'read',
						);
					}
				}
			}
		}

		if ( '' !== $post_type ) {
			$type_object = get_post_type_object( $post_type );
			if ( $type_object instanceof \WP_Post_Type && $type_object->show_ui && ! empty( $type_object->cap->edit_posts ) ) {
				$commands[] = array(
					'id'          => 'block-editor-all-items',
					'label'       => sprintf(
						/* translators: %s: plural post type name. */
						__( 'All %s', 'printah' ),
						$type_object->labels->name
					),
					'description' => __( 'Exit the editor to the content list', 'printah' ),
					'keywords'    => array( 'all', 'list', 'exit', strtolower( $type_object->labels->name ) ),
					'url'         => admin_url( 'edit.php' . ( 'post' === $post_type ? '' : '?post_type=' . $post_type ) ),
					'category'    => 'konten',
					'capability'  => $type_object->cap->edit_posts,
				);
			}
		}

		$commands[] = array(
			'id'          => 'block-editor-dashboard',
			'label'       => __( 'Back to Dashboard', 'printah' ),
			'description' => __( 'Leave the Block Editor and return to WP Admin', 'printah' ),
			'keywords'    => array( 'dashboard', 'exit', 'home', 'admin' ),
			'url'         => admin_url(),
			'category'    => 'utama',
			'capability'  => 'read',
		);

		return $commands;
	}

	/**
	 * Returns WordPress core navigation and settings commands.
	 *
	 * @return array
	 */
	private function get_core_commands(): array {
		$commands = array(
			array(
				'id'          => 'dashboard',
				'label'       => __( 'Dashboard', 'printah' ),
				'description' => __( 'Site overview and dashboard widgets', 'printah' ),
				'keywords'    => array( 'home', 'overview', 'dashboard', 'admin' ),
				'url'         => admin_url(),
				'category'    => 'utama',
				'capability'  => 'read',
			),
			array(
				'id'          => 'updates',
				'label'       => __( 'Updates', 'printah' ),
				'description' => __( 'Update WordPress core, plugins, and themes', 'printah' ),
				'keywords'    => array( 'updates', 'update', 'upgrade', 'version' ),
				'url'         => admin_url( 'update-core.php' ),
				'category'    => 'utama',
				'capability'  => array( 'update_core', 'update_plugins', 'update_themes' ),
			),
			array(
				'id'          => 'profile',
				'label'       => __( 'Profile', 'printah' ),
				'description' => __( 'Edit your profile and password', 'printah' ),
				'keywords'    => array( 'profile', 'account', 'user', 'password' ),
				'url'         => admin_url( 'profile.php' ),
				'category'    => 'utama',
				'capability'  => 'read',
			),
			array(
				'id'          => 'posts',
				'label'       => __( 'Posts', 'printah' ),
				'description' => __( 'Manage all posts and articles', 'printah' ),
				'keywords'    => array( 'posts', 'articles', 'blog', 'writing' ),
				'url'         => admin_url( 'edit.php' ),
				'category'    => 'konten',
				'capability'  => 'edit_posts',
			),
			array(
				'id'          => 'new-post',
				'label'       => __( 'Add New Post', 'printah' ),
				'description' => __( 'Create a new blog post', 'printah' ),
				'keywords'    => array( 'add new post', 'write', 'create post', 'new article' ),
				'url'         => admin_url( 'post-new.php' ),
				'category'    => 'konten',
				'capability'  => 'edit_posts',
			),
			array(
				'id'          => 'categories',
				'label'       => __( 'Categories', 'printah' ),
				'description' => __( 'Manage post categories', 'printah' ),
				'keywords'    => array( 'categories', 'taxonomy', 'post categories' ),
				'url'         => admin_url( 'edit-tags.php?taxonomy=category' ),
				'category'    => 'konten',
				'capability'  => 'manage_categories',
			),
			array(
				'id'          => 'tags',
				'label'       => __( 'Tags', 'printah' ),
				'description' => __( 'Manage post tags', 'printah' ),
				'keywords'    => array( 'tags', 'taxonomy', 'post tags', 'labels' ),
				'url'         => admin_url( 'edit-tags.php?taxonomy=post_tag' ),
				'category'    => 'konten',
				'capability'  => 'manage_categories',
			),
			array(
				'id'          => 'pages',
				'label'       => __( 'Pages', 'printah' ),
				'description' => __( 'Manage all site pages', 'printah' ),
				'keywords'    => array( 'pages', 'page' ),
				'url'         => admin_url( 'edit.php?post_type=page' ),
				'category'    => 'konten',
				'capability'  => 'edit_pages',
			),
			array(
				'id'          => 'new-page',
				'label'       => __( 'Add New Page', 'printah' ),
				'description' => __( 'Create a new page', 'printah' ),
				'keywords'    => array( 'add new page', 'create page', 'new page' ),
				'url'         => admin_url( 'post-new.php?post_type=page' ),
				'category'    => 'konten',
				'capability'  => 'edit_pages',
			),
			array(
				'id'          => 'media',
				'label'       => __( 'Media Library', 'printah' ),
				'description' => __( 'Browse images, videos, and files', 'printah' ),
				'keywords'    => array( 'media', 'media library', 'images', 'photos', 'videos', 'files', 'upload' ),
				'url'         => admin_url( 'upload.php' ),
				'category'    => 'konten',
				'capability'  => 'upload_files',
			),
			array(
				'id'          => 'comments',
				'label'       => __( 'Comments', 'printah' ),
				'description' => __( 'Moderate and manage comments', 'printah' ),
				'keywords'    => array( 'comments', 'moderation', 'replies', 'reviews' ),
				'url'         => admin_url( 'edit-comments.php' ),
				'category'    => 'konten',
				'capability'  => array( 'edit_posts', 'moderate_comments' ),
			),
			array(
				'id'          => 'themes',
				'label'       => __( 'Themes', 'printah' ),
				'description' => __( 'Manage and switch active themes', 'printah' ),
				'keywords'    => array( 'themes', 'appearance', 'design' ),
				'url'         => admin_url( 'themes.php' ),
				'category'    => 'situs',
				'capability'  => 'switch_themes',
			),
		);

		$is_block_theme = function_exists( 'wp_is_block_theme' ) && wp_is_block_theme();

		if ( $is_block_theme ) {
			$commands[] = array(
				'id'          => 'site-editor',
				'label'       => __( 'Site Editor', 'printah' ),
				'description' => __( 'Customize full site editing templates', 'printah' ),
				'keywords'    => array( 'site editor', 'full site editing', 'fse', 'theme', 'customize' ),
				'url'         => admin_url( 'site-editor.php' ),
				'category'    => 'situs',
				'capability'  => 'edit_theme_options',
			);
		} else {
			$commands[] = array(
				'id'          => 'customize',
				'label'       => __( 'Customize', 'printah' ),
				'description' => __( 'Open the WordPress Theme Customizer', 'printah' ),
				'keywords'    => array( 'customize', 'customizer', 'appearance', 'design' ),
				'url'         => admin_url( 'customize.php' ),
				'category'    => 'situs',
				'capability'  => 'customize',
			);
			$commands[] = array(
				'id'          => 'menus',
				'label'       => __( 'Menus', 'printah' ),
				'description' => __( 'Manage navigation menus', 'printah' ),
				'keywords'    => array( 'menus', 'menu', 'navigation', 'appearance' ),
				'url'         => admin_url( 'nav-menus.php' ),
				'category'    => 'situs',
				'capability'  => 'edit_theme_options',
			);
		}

		$commands = array_merge(
			$commands,
			array(
				array(
					'id'          => 'plugins',
					'label'       => __( 'Plugins', 'printah' ),
					'description' => __( 'Manage installed plugins', 'printah' ),
					'keywords'    => array( 'plugins', 'extensions', 'add-ons' ),
					'url'         => admin_url( 'plugins.php' ),
					'category'    => 'situs',
					'capability'  => 'activate_plugins',
				),
				array(
					'id'          => 'install-plugins',
					'label'       => __( 'Add New Plugin', 'printah' ),
					'description' => __( 'Search and install new plugins', 'printah' ),
					'keywords'    => array( 'add new plugin', 'install plugin', 'new plugin' ),
					'url'         => admin_url( 'plugin-install.php' ),
					'category'    => 'situs',
					'capability'  => 'install_plugins',
				),
				array(
					'id'          => 'users',
					'label'       => __( 'Users', 'printah' ),
					'description' => __( 'Manage user accounts and roles', 'printah' ),
					'keywords'    => array( 'users', 'accounts', 'members', 'roles' ),
					'url'         => admin_url( 'users.php' ),
					'category'    => 'situs',
					'capability'  => 'list_users',
				),
				array(
					'id'          => 'tools',
					'label'       => __( 'Tools', 'printah' ),
					'description' => __( 'Site utilities, import, and export', 'printah' ),
					'keywords'    => array( 'tools', 'import', 'export', 'site health' ),
					'url'         => admin_url( 'tools.php' ),
					'category'    => 'situs',
					'capability'  => array( 'manage_options', 'import', 'export' ),
				),
				array(
					'id'          => 'settings-general',
					'label'       => __( 'General Settings', 'printah' ),
					'description' => __( 'Site title, tagline, timezone, and language', 'printah' ),
					'keywords'    => array( 'settings', 'general', 'site title', 'timezone' ),
					'url'         => admin_url( 'options-general.php' ),
					'category'    => 'pengaturan',
					'capability'  => 'manage_options',
				),
				array(
					'id'          => 'settings-writing',
					'label'       => __( 'Writing Settings', 'printah' ),
					'description' => __( 'Default post format and category', 'printah' ),
					'keywords'    => array( 'settings', 'writing', 'posting' ),
					'url'         => admin_url( 'options-writing.php' ),
					'category'    => 'pengaturan',
					'capability'  => 'manage_options',
				),
				array(
					'id'          => 'settings-reading',
					'label'       => __( 'Reading Settings', 'printah' ),
					'description' => __( 'Homepage display and search engine visibility', 'printah' ),
					'keywords'    => array( 'settings', 'reading', 'homepage', 'blog' ),
					'url'         => admin_url( 'options-reading.php' ),
					'category'    => 'pengaturan',
					'capability'  => 'manage_options',
				),
				array(
					'id'          => 'settings-discussion',
					'label'       => __( 'Discussion Settings', 'printah' ),
					'description' => __( 'Comment moderation and avatar preferences', 'printah' ),
					'keywords'    => array( 'settings', 'discussion', 'comments', 'avatars' ),
					'url'         => admin_url( 'options-discussion.php' ),
					'category'    => 'pengaturan',
					'capability'  => 'manage_options',
				),
				array(
					'id'          => 'settings-media',
					'label'       => __( 'Media Settings', 'printah' ),
					'description' => __( 'Image sizes and upload organization', 'printah' ),
					'keywords'    => array( 'settings', 'media', 'images', 'thumbnails' ),
					'url'         => admin_url( 'options-media.php' ),
					'category'    => 'pengaturan',
					'capability'  => 'manage_options',
				),
				array(
					'id'          => 'settings-permalinks',
					'label'       => __( 'Permalinks Settings', 'printah' ),
					'description' => __( 'URL structure for posts and pages', 'printah' ),
					'keywords'    => array( 'settings', 'permalinks', 'urls', 'slugs', 'rewrite' ),
					'url'         => admin_url( 'options-permalink.php' ),
					'category'    => 'pengaturan',
					'capability'  => 'manage_options',
				),
				array(
					'id'          => 'settings-privacy',
					'label'       => __( 'Privacy Settings', 'printah' ),
					'description' => __( 'Manage site privacy policy page', 'printah' ),
					'keywords'    => array( 'settings', 'privacy', 'policy', 'gdpr' ),
					'url'         => admin_url( 'options-privacy.php' ),
					'category'    => 'pengaturan',
					'capability'  => 'manage_privacy_options',
				),
				array(
					'id'          => 'printah-settings',
					'label'       => __( 'Printah Settings', 'printah' ),
					'description' => __( 'Configure Printah shortcuts, floating pill, and modules', 'printah' ),
					'keywords'    => array( 'printah', 'command palette', 'shortcuts', 'floating pill', 'settings', 'preferences' ),
					'url'         => admin_url( 'options-general.php?page=printah' ),
					'category'    => 'pengaturan',
					'capability'  => 'manage_options',
				),
			)
		);

		return $commands;
	}

	/**
	 * Returns Elementor ecosystem commands when Elementor is active.
	 *
	 * @return array
	 */
	private function get_elementor_commands(): array {
		$settings = Printah_Settings::get();
		if ( empty( $settings['module_elementor_enabled'] ) ) {
			return array();
		}

		if ( ! did_action( 'elementor/loaded' ) && ! defined( 'ELEMENTOR_VERSION' ) ) {
			return array();
		}

		$commands = array(
			array(
				'id'          => 'elementor-templates',
				'label'       => __( 'Elementor Saved Templates', 'printah' ),
				'description' => __( 'Manage saved Elementor templates', 'printah' ),
				'keywords'    => array( 'elementor', 'templates', 'saved templates', 'library' ),
				'url'         => admin_url( 'edit.php?post_type=elementor_library' ),
				'category'    => 'elementor',
				'capability'  => 'edit_posts',
			),
			array(
				'id'          => 'elementor-settings',
				'label'       => __( 'Elementor Settings', 'printah' ),
				'description' => __( 'Configure Elementor features and integrations', 'printah' ),
				'keywords'    => array( 'elementor', 'settings', 'configuration' ),
				'url'         => $this->get_elementor_settings_url(),
				'category'    => 'elementor',
				'capability'  => 'manage_options',
			),
			array(
				'id'          => 'elementor-tools',
				'label'       => __( 'Elementor Tools', 'printah' ),
				'description' => __( 'Regenerate CSS, sync library, and utilities', 'printah' ),
				'keywords'    => array( 'elementor', 'tools', 'regenerate css', 'sync', 'cache' ),
				'url'         => admin_url( 'admin.php?page=elementor-tools' ),
				'category'    => 'elementor',
				'capability'  => 'manage_options',
			),
		);

		if ( defined( 'ELEMENTOR_PRO_VERSION' ) ) {
			$commands[] = array(
				'id'          => 'elementor-theme-builder',
				'label'       => __( 'Elementor Theme Builder', 'printah' ),
				'description' => __( 'Manage headers, footers, and theme templates', 'printah' ),
				'keywords'    => array( 'elementor', 'theme builder', 'header', 'footer', 'site editor', 'pro' ),
				'url'         => $this->get_elementor_theme_builder_url(),
				'category'    => 'elementor',
				'capability'  => 'manage_options',
			);
		}

		return $commands;
	}

	/**
	 * Returns WooCommerce ecosystem commands when WooCommerce is active.
	 *
	 * @return array
	 */
	private function get_woocommerce_commands(): array {
		$settings = Printah_Settings::get();
		if ( empty( $settings['module_woocommerce_enabled'] ) ) {
			return array();
		}

		if ( ! class_exists( 'WooCommerce' ) ) {
			return array();
		}

		return array(
			array(
				'id'          => 'woocommerce-home',
				'label'       => __( 'WooCommerce', 'printah' ),
				'description' => __( 'Store overview and WooCommerce tasks', 'printah' ),
				'keywords'    => array( 'woocommerce', 'woo', 'store', 'shop', 'home' ),
				'url'         => admin_url( 'admin.php?page=wc-admin' ),
				'category'    => 'toko',
				'capability'  => 'manage_woocommerce',
			),
			array(
				'id'          => 'woocommerce-orders',
				'label'       => __( 'WooCommerce Orders', 'printah' ),
				'description' => __( 'View and process customer orders', 'printah' ),
				'keywords'    => array( 'woocommerce', 'orders', 'order', 'sales', 'fulfillment' ),
				'url'         => $this->get_woocommerce_orders_url(),
				'category'    => 'toko',
				'capability'  => 'edit_shop_orders',
			),
			array(
				'id'          => 'woocommerce-products',
				'label'       => __( 'WooCommerce Products', 'printah' ),
				'description' => __( 'Manage your store product catalog', 'printah' ),
				'keywords'    => array( 'woocommerce', 'products', 'catalog', 'inventory' ),
				'url'         => admin_url( 'edit.php?post_type=product' ),
				'category'    => 'toko',
				'capability'  => 'edit_products',
			),
			array(
				'id'          => 'woocommerce-new-product',
				'label'       => __( 'Add New Product', 'printah' ),
				'description' => __( 'Create a new WooCommerce product', 'printah' ),
				'keywords'    => array( 'woocommerce', 'add new product', 'new product', 'create product' ),
				'url'         => admin_url( 'post-new.php?post_type=product' ),
				'category'    => 'toko',
				'capability'  => 'edit_products',
			),
			array(
				'id'          => 'woocommerce-coupons',
				'label'       => __( 'WooCommerce Coupons', 'printah' ),
				'description' => __( 'Manage discount codes and promotions', 'printah' ),
				'keywords'    => array( 'woocommerce', 'coupons', 'discounts', 'promo', 'vouchers' ),
				'url'         => admin_url( 'edit.php?post_type=shop_coupon' ),
				'category'    => 'toko',
				'capability'  => array( 'edit_shop_coupons', 'manage_woocommerce' ),
			),
			array(
				'id'          => 'woocommerce-customers',
				'label'       => __( 'WooCommerce Customers', 'printah' ),
				'description' => __( 'Browse customer profiles and order history', 'printah' ),
				'keywords'    => array( 'woocommerce', 'customers', 'buyers', 'crm' ),
				'url'         => admin_url( 'admin.php?page=wc-admin&path=/customers' ),
				'category'    => 'toko',
				'capability'  => 'manage_woocommerce',
			),
			array(
				'id'          => 'woocommerce-analytics',
				'label'       => __( 'WooCommerce Analytics', 'printah' ),
				'description' => __( 'Sales reports, revenue, and store metrics', 'printah' ),
				'keywords'    => array( 'woocommerce', 'analytics', 'reports', 'sales', 'revenue' ),
				'url'         => admin_url( 'admin.php?page=wc-admin&path=/analytics/overview' ),
				'category'    => 'toko',
				'capability'  => array( 'view_woocommerce_reports', 'manage_woocommerce' ),
			),
			array(
				'id'          => 'woocommerce-settings',
				'label'       => __( 'WooCommerce Settings', 'printah' ),
				'description' => __( 'Configure store, payments, and shipping', 'printah' ),
				'keywords'    => array( 'woocommerce', 'settings', 'payments', 'shipping', 'store' ),
				'url'         => admin_url( 'admin.php?page=wc-settings' ),
				'category'    => 'toko',
				'capability'  => 'manage_woocommerce',
			),
		);
	}

	/**
	 * Resolves the Elementor Settings admin URL across Elementor versions.
	 *
	 * @return string
	 */
	private function get_elementor_settings_url(): string {
		if ( class_exists( '\Elementor\Includes\Settings\AdminMenuItems\Editor_One_Settings_Menu' ) ) {
			return admin_url( 'admin.php?page=elementor-settings' );
		}

		return admin_url( 'admin.php?page=elementor' );
	}

	/**
	 * Resolves the Elementor Pro Theme Builder admin URL.
	 *
	 * @return string
	 */
	private function get_elementor_theme_builder_url(): string {
		if (
			class_exists( '\Elementor\Plugin' ) &&
			isset( \Elementor\Plugin::$instance->app ) &&
			\Elementor\Plugin::$instance->app
		) {
			$menu_url = \Elementor\Plugin::$instance->app->get_settings( 'menu_url' );
			if ( is_string( $menu_url ) && '' !== $menu_url ) {
				return esc_url_raw( $menu_url );
			}
		}

		return admin_url( 'admin.php?page=elementor-app#/site-editor' );
	}

	/**
	 * Resolves the WooCommerce Orders admin URL based on HPOS status.
	 *
	 * @return string
	 */
	private function get_woocommerce_orders_url(): string {
		if (
			class_exists( '\Automattic\WooCommerce\Utilities\OrderUtil' ) &&
			\Automattic\WooCommerce\Utilities\OrderUtil::custom_orders_table_usage_is_enabled()
		) {
			return admin_url( 'admin.php?page=wc-orders' );
		}

		return admin_url( 'edit.php?post_type=shop_order' );
	}

	/**
	 * Filters commands by user capability and strips internal capability metadata.
	 *
	 * @param array $commands Raw command definitions.
	 * @return array
	 */
	private function filter_commands_for_current_user( array $commands ): array {
		$visible = array();

		foreach ( $commands as $command ) {
			if ( ! is_array( $command ) ) {
				continue;
			}

			if ( ! $this->current_user_can_access_command( $command ) ) {
				continue;
			}

			unset( $command['capability'] );
			$visible[] = $command;
		}

		return $visible;
	}

	/**
	 * Checks whether the current user satisfies a command's capability requirement.
	 *
	 * @param array $command Command definition.
	 * @return bool
	 */
	private function current_user_can_access_command( array $command ): bool {
		if ( ! isset( $command['capability'] ) || '' === $command['capability'] ) {
			return true;
		}

		$capability = $command['capability'];

		if ( is_string( $capability ) ) {
			return current_user_can( $capability );
		}

		if ( is_array( $capability ) && ! empty( $capability ) ) {
			foreach ( $capability as $cap ) {
				if ( is_string( $cap ) && '' !== $cap && current_user_can( $cap ) ) {
					return true;
				}
			}

			return false;
		}

		return false;
	}
}
