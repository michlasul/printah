<?php
/**
 * Register all actions and filters for the plugin
 *
 * @since      1.0.0
 *
 * @package    Printah
 * @subpackage Printah/includes
 */

namespace Printah;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Register all actions and filters for the plugin.
 *
 * Maintain a list of all hooks that are registered throughout
 * the plugin, and register them with the WordPress API. Call the
 * run function to execute the list of actions and filters.
 *
 * @package    Printah
 * @subpackage Printah/includes
 * @author     Ichlas
 */
class Printah_Loader {

	/**
	 * The array of actions registered with WordPress.
	 *
	 * @since    1.0.0
	 * @access   protected
	 * @var      array    $actions    The actions registered with WordPress to fire when the plugin loads.
	 */
	protected $actions;

	/**
	 * The array of filters registered with WordPress.
	 *
	 * @since    1.0.0
	 * @access   protected
	 * @var      array    $filters    The filters registered with WordPress to fire when the plugin loads.
	 */
	protected $filters;

	/**
	 * The array of actions removed via WordPress remove_action().
	 *
	 * @since    1.0.0
	 * @access   protected
	 * @var      array    $removed_actions    The actions removed by Printah at runtime.
	 */
	protected $removed_actions;

	/**
	 * The array of custom hooks dispatched via Printah_Loader.
	 *
	 * @since    1.0.0
	 * @access   protected
	 * @var      array    $dispatched_hooks    Custom actions and filters dispatched by Printah.
	 */
	protected $dispatched_hooks;

	/**
	 * Initialize the collections used to maintain the actions and filters.
	 *
	 * @since    1.0.0
	 */
	public function __construct() {
		$this->actions          = array();
		$this->filters          = array();
		$this->removed_actions  = array();
		$this->dispatched_hooks = array();
	}

	/**
	 * Add a new action to the collection to be registered with WordPress.
	 *
	 * @since    1.0.0
	 * @param    string $hook             The name of the WordPress action that is being registered.
	 * @param    object $component        A reference to the instance of the object on which the action is defined.
	 * @param    string $callback         The name of the function definition on the $component.
	 * @param    int    $priority         Optional. The priority at which the function should be fired. Default is 10.
	 * @param    int    $accepted_args    Optional. The number of arguments that should be passed to the $callback. Default is 1.
	 */
	public function add_action( $hook, $component, $callback, $priority = 10, $accepted_args = 1 ) {
		$this->actions = $this->add( $this->actions, $hook, $component, $callback, $priority, $accepted_args );
	}

	/**
	 * Add a new filter to the collection to be registered with WordPress.
	 *
	 * @since    1.0.0
	 * @param    string $hook             The name of the WordPress filter that is being registered.
	 * @param    object $component        A reference to the instance of the object on which the filter is defined.
	 * @param    string $callback         The name of the function definition on the $component.
	 * @param    int    $priority         Optional. The priority at which the function should be fired. Default is 10.
	 * @param    int    $accepted_args    Optional. The number of arguments that should be passed to the $callback. Default is 1.
	 */
	public function add_filter( $hook, $component, $callback, $priority = 10, $accepted_args = 1 ) {
		$this->filters = $this->add( $this->filters, $hook, $component, $callback, $priority, $accepted_args );
	}

	/**
	 * Remove a registered WordPress action and record it in the loader registry.
	 *
	 * @since    1.0.0
	 * @param    string          $hook     The action hook to which the callback is hooked.
	 * @param    callable|string $callback The callback to be removed.
	 * @param    int             $priority Optional. The priority of the callback. Default is 10.
	 * @return   bool                      Whether the callback existed before removal.
	 */
	public function remove_action( $hook, $callback, $priority = 10 ) {
		$removed = remove_action( $hook, $callback, $priority );

		$this->removed_actions[] = array(
			'hook'     => $hook,
			'callback' => $callback,
			'priority' => $priority,
			'removed'  => $removed,
		);

		return $removed;
	}

	/**
	 * Dispatch a WordPress filter hook and record it in the loader registry.
	 *
	 * @since    1.0.0
	 * @param    string $hook_name The name of the filter hook.
	 * @param    mixed  $value     The value to filter.
	 * @param    mixed  ...$args   Additional arguments passed to the hooked callbacks.
	 * @return   mixed             The filtered value after all hooked functions are applied.
	 */
	public function apply_filters( $hook_name, $value, ...$args ) {
		$this->record_dispatched_hook( 'filter', $hook_name );

		// phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.DynamicHooknameFound -- Callers pass Printah-prefixed hook names through Printah_Loader.
		return apply_filters( $hook_name, $value, ...$args );
	}

	/**
	 * Dispatch a WordPress action hook and record it in the loader registry.
	 *
	 * @since    1.0.0
	 * @param    string $hook_name The name of the action hook.
	 * @param    mixed  ...$args   Additional arguments passed to the hooked callbacks.
	 * @return   void
	 */
	public function do_action( $hook_name, ...$args ): void {
		$this->record_dispatched_hook( 'action', $hook_name );

		// phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.DynamicHooknameFound -- Callers pass Printah-prefixed hook names through Printah_Loader.
		do_action( $hook_name, ...$args );
	}

	/**
	 * Return all hooks registered, removed, or dispatched via Printah_Loader.
	 *
	 * Useful for debugging hook wiring and inspecting active Printah hooks.
	 *
	 * @since    1.0.0
	 * @return   array{
	 *     actions: array,
	 *     filters: array,
	 *     removed_actions: array,
	 *     dispatched_hooks: array
	 * }
	 */
	public function get_hooks(): array {
		return array(
			'actions'          => $this->actions,
			'filters'          => $this->filters,
			'removed_actions'  => $this->removed_actions,
			'dispatched_hooks' => $this->dispatched_hooks,
		);
	}

	/**
	 * Record a dispatched action or filter name once per type and hook.
	 *
	 * @since    1.0.0
	 * @access   private
	 * @param    string $type      Hook type ('action' or 'filter').
	 * @param    string $hook_name WordPress hook name.
	 * @return   void
	 */
	private function record_dispatched_hook( string $type, string $hook_name ): void {
		$key = $type . ':' . $hook_name;

		if ( ! isset( $this->dispatched_hooks[ $key ] ) ) {
			$this->dispatched_hooks[ $key ] = array(
				'type' => $type,
				'hook' => $hook_name,
			);
		}
	}

	/**
	 * A utility function that is used to register the actions and hooks into a single
	 * collection.
	 *
	 * @since    1.0.0
	 * @access   private
	 * @param    array  $hooks            The collection of hooks that is being registered (that is, actions or filters).
	 * @param    string $hook             The name of the WordPress filter that is being registered.
	 * @param    object $component        A reference to the instance of the object on which the filter is defined.
	 * @param    string $callback         The name of the function definition on the $component.
	 * @param    int    $priority         The priority at which the function should be fired.
	 * @param    int    $accepted_args    The number of arguments that should be passed to the $callback.
	 * @return   array                                  The collection of actions and filters registered with WordPress.
	 */
	private function add( $hooks, $hook, $component, $callback, $priority, $accepted_args ) {

		$hooks[] = array(
			'hook'          => $hook,
			'component'     => $component,
			'callback'      => $callback,
			'priority'      => $priority,
			'accepted_args' => $accepted_args,
		);

		return $hooks;
	}

	/**
	 * Register the filters and actions with WordPress.
	 *
	 * @since    1.0.0
	 */
	public function run() {

		foreach ( $this->filters as $hook ) {
			add_filter( $hook['hook'], array( $hook['component'], $hook['callback'] ), $hook['priority'], $hook['accepted_args'] );
		}

		foreach ( $this->actions as $hook ) {
			add_action( $hook['hook'], array( $hook['component'], $hook['callback'] ), $hook['priority'], $hook['accepted_args'] );
		}
	}
}
