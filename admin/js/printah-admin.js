document.addEventListener( 'DOMContentLoaded', () => {
	const printah = document.getElementById( 'printah-shortcut' );
	const native = document.getElementById( 'printah-native-shortcut' );
	const form = printah?.closest( 'form' );
	if ( ! printah || ! native || ! form ) {
		return;
	}
	form.addEventListener( 'submit', ( event ) => {
		if ( printah.value === native.value ) {
			event.preventDefault();
			native.setCustomValidity(
				'Choose a different shortcut for the WordPress palette.'
			);
			native.reportValidity();
		}
	} );
	native.addEventListener( 'change', () => native.setCustomValidity( '' ) );
	printah.addEventListener( 'change', () => native.setCustomValidity( '' ) );
} );
