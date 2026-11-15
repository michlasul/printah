import { useEffect } from '@wordpress/element';
import CommandPalette from './components/CommandPalette';
import { syncNativePalette } from './nativePalette';
import { shortcutLabel } from './config';
import './toolbar.css';

function App() {
	const config = window.printahConfig;
	useEffect( () => {
		if ( config?.settings.native_palette_enabled ) {
			const label = document.querySelector( '#wp-admin-bar-command-palette .ab-label kbd' );
			if ( label ) label.textContent = shortcutLabel( config.settings.native_shortcut );
		}
		if ( config?.settings.hide_toolbar && config.toolbar?.site && config.toolbar.profile.length ) {
			document.documentElement.classList.add( 'printah-toolbar-ready' );
		}
		const disconnect = syncNativePalette( config?.settings ?? {
			printah_shortcut: 'mod+k',
			native_palette_enabled: false,
			native_shortcut: 'mod+j',
			hide_toolbar: true,
		} );
		return () => {
			document.documentElement.classList.remove( 'printah-toolbar-ready' );
			disconnect();
		};
	}, [ config ] );
	return (
		<CommandPalette
			commands={ config?.commands ?? [] }
			searchUrl={ config?.searchUrl }
			restNonce={ config?.restNonce }
			settings={ config?.settings ?? {
				printah_shortcut: 'mod+k',
				native_palette_enabled: false,
				native_shortcut: 'mod+j',
				hide_toolbar: true,
			} }
			toolbar={ config?.toolbar }
		/>
	);
}

export default App;
