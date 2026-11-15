( function () {
	const form = document.getElementById( 'printah-settings-form' );
	if ( ! form ) {
		return;
	}

	const printahSelect = document.getElementById( 'printah_shortcut' );
	const nativeToggle = document.getElementById( 'native_palette_enabled' );
	const nativeSelect = document.getElementById( 'native_shortcut' );
	const nativeRow = document.getElementById( 'printah-native-shortcut-row' );
	const showPillToggle = document.getElementById( 'show_floating_pill' );
	const hideToolbarToggle = document.getElementById( 'hide_toolbar' );
	const shortcutError = document.getElementById( 'printah-shortcut-error' );
	const toolbarError = document.getElementById( 'printah-toolbar-error' );
	const feedbackBanner = document.getElementById(
		'printah-settings-feedback'
	);
	const guideOpenKey = document.getElementById( 'printah-guide-open' );

	const messages =
		( window.printahAdmin && window.printahAdmin.messages ) || {};
	const shortcutConflictText =
		messages.shortcutConflict ||
		'Printah shortcut and WordPress Command Palette shortcut must be different.';
	const pillToolbarConflictText =
		messages.pillToolbarConflict ||
		'Keep either the floating pill or the WordPress admin toolbar visible so quick navigation stays accessible.';

	function setFieldValidation( control, errorEl, errorMessage ) {
		if ( ! control || ! errorEl ) {
			return;
		}
		const hintId = control.getAttribute( 'data-hint-id' ) || '';
		const errorId = control.getAttribute( 'data-error-id' ) || errorEl.id;
		const isInvalid = Boolean( errorMessage );

		control.setAttribute( 'aria-invalid', isInvalid ? 'true' : 'false' );
		if ( typeof control.setCustomValidity === 'function' ) {
			control.setCustomValidity( errorMessage || '' );
		}

		if ( isInvalid ) {
			control.setAttribute(
				'aria-describedby',
				[ hintId, errorId ].filter( Boolean ).join( ' ' )
			);
		} else if ( hintId ) {
			control.setAttribute( 'aria-describedby', hintId );
		} else {
			control.removeAttribute( 'aria-describedby' );
		}
	}

	function syncNativeRowState() {
		if ( ! nativeToggle || ! nativeSelect ) {
			return;
		}
		const enabled = nativeToggle.checked;
		nativeSelect.disabled = ! enabled;
		if ( nativeRow ) {
			nativeRow.classList.toggle( 'is-disabled', ! enabled );
		}
	}

	function syncGuideOpenKey() {
		if ( ! printahSelect || ! guideOpenKey ) {
			return;
		}
		const selectedOption =
			printahSelect.options[ printahSelect.selectedIndex ];
		if ( selectedOption ) {
			guideOpenKey.textContent = selectedOption.textContent || '';
		}
	}

	function validateAll( showBanner ) {
		const shortcutConflict = Boolean(
			printahSelect &&
			nativeSelect &&
			printahSelect.value === nativeSelect.value
		);
		const pillToolbarConflict = Boolean(
			showPillToggle &&
			hideToolbarToggle &&
			! showPillToggle.checked &&
			hideToolbarToggle.checked
		);

		if ( shortcutError ) {
			shortcutError.textContent = shortcutConflict
				? shortcutConflictText
				: '';
			shortcutError.hidden = ! shortcutConflict;
		}
		setFieldValidation(
			printahSelect,
			shortcutError,
			shortcutConflict ? shortcutConflictText : ''
		);
		setFieldValidation(
			nativeSelect,
			shortcutError,
			shortcutConflict ? shortcutConflictText : ''
		);

		if ( toolbarError ) {
			toolbarError.textContent = pillToolbarConflict
				? pillToolbarConflictText
				: '';
			toolbarError.hidden = ! pillToolbarConflict;
		}
		setFieldValidation(
			showPillToggle,
			toolbarError,
			pillToolbarConflict ? pillToolbarConflictText : ''
		);
		setFieldValidation(
			hideToolbarToggle,
			toolbarError,
			pillToolbarConflict ? pillToolbarConflictText : ''
		);

		if ( feedbackBanner ) {
			const bannerMessages = [];
			if ( shortcutConflict ) {
				bannerMessages.push( shortcutConflictText );
			}
			if ( pillToolbarConflict ) {
				bannerMessages.push( pillToolbarConflictText );
			}

			if ( showBanner && bannerMessages.length > 0 ) {
				feedbackBanner.textContent = bannerMessages[ 0 ];
				feedbackBanner.hidden = false;
			} else {
				feedbackBanner.textContent = '';
				feedbackBanner.hidden = true;
			}
		}

		return ! shortcutConflict && ! pillToolbarConflict;
	}

	if ( printahSelect ) {
		printahSelect.addEventListener( 'change', function () {
			syncGuideOpenKey();
			validateAll( false );
		} );
	}

	if ( nativeSelect ) {
		nativeSelect.addEventListener( 'change', function () {
			validateAll( false );
		} );
	}

	if ( nativeToggle ) {
		nativeToggle.addEventListener( 'change', function () {
			syncNativeRowState();
			validateAll( false );
		} );
	}

	if ( showPillToggle ) {
		showPillToggle.addEventListener( 'change', function () {
			validateAll( false );
		} );
	}

	if ( hideToolbarToggle ) {
		hideToolbarToggle.addEventListener( 'change', function () {
			validateAll( false );
		} );
	}

	form.addEventListener( 'submit', function ( event ) {
		if ( ! validateAll( true ) ) {
			event.preventDefault();
			const firstInvalid = form.querySelector( '[aria-invalid="true"]' );
			if ( firstInvalid && typeof firstInvalid.focus === 'function' ) {
				firstInvalid.focus();
			}
		}
	} );

	syncNativeRowState();
	syncGuideOpenKey();
	validateAll( false );
} )();
