import { useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import CommandPalette from './components/CommandPalette';
import { syncNativePalette } from './nativePalette';
import { shortcutLabel } from './config';
import './toolbar.css';

function App() {
	const config = window.printahConfig;
	useEffect( () => {
		if ( config?.settings.native_palette_enabled ) {
			const nativeLabel = shortcutLabel(
				config.settings.native_shortcut
			);
			const label = document.querySelector(
				'#wp-admin-bar-command-palette .ab-label kbd, .wp-admin-bar-command-palette kbd'
			);
			if ( label ) {
				label.textContent = nativeLabel;
			}
			const trigger = document.querySelector< HTMLElement >(
				'#wp-admin-bar-command-palette .ab-item, #wp-admin-bar-command-palette button'
			);
			if ( trigger ) {
				const accessibleTitle = sprintf(
					/* translators: %s: keyboard shortcut label. */
					__( 'WordPress Command Palette (%s)', 'printah' ),
					nativeLabel
				);
				trigger.setAttribute( 'aria-label', accessibleTitle );
				trigger.setAttribute( 'title', accessibleTitle );
			}
		}

		const screen = config?.context?.screen ?? 'admin';
		const canHideToolbar =
			screen === 'admin' &&
			Boolean( config?.settings.hide_toolbar ) &&
			config?.settings.show_floating_pill !== false &&
			Boolean( config?.toolbar?.site ) &&
			Boolean( config?.toolbar?.profile.length );

		if ( canHideToolbar ) {
			document.documentElement.classList.add( 'printah-toolbar-ready' );
		} else {
			document.documentElement.classList.remove(
				'printah-toolbar-ready'
			);
		}
		const disconnect = syncNativePalette(
			config?.settings ?? {
				printah_shortcut: 'mod+k',
				native_palette_enabled: false,
				native_shortcut: 'mod+j',
				hide_toolbar: true,
				show_floating_pill: true,
				content_search_enabled: true,
			}
		);
		return () => {
			document.documentElement.classList.remove(
				'printah-toolbar-ready'
			);
			disconnect();
		};
	}, [ config ] );
	return (
		<CommandPalette
			commands={ config?.commands ?? [] }
			searchUrl={ config?.searchUrl }
			restNonce={ config?.restNonce }
			settings={
				config?.settings ?? {
					printah_shortcut: 'mod+k',
					native_palette_enabled: false,
					native_shortcut: 'mod+j',
					hide_toolbar: true,
					show_floating_pill: true,
					content_search_enabled: true,
				}
			}
			toolbar={ config?.toolbar }
			context={ config?.context }
		/>
	);
}

export default App;
