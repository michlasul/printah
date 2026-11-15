import { createRoot } from '@wordpress/element';
import App from './App';

const container = document.getElementById( 'printah-root' );

if ( container ) {
	createRoot( container ).render( <App /> );
}
