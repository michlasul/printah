/**
 * Bridges keyboard and pointer events from Elementor's preview iframe.
 *
 * Inside the Elementor editor, clicking widgets moves focus into
 * `#elementor-preview-iframe`, so top-level window listeners miss shortcuts
 * and outside clicks unless forwarded from the preview iframe's window.
 *
 * @param enabled       Whether Elementor editor preview bridging is active.
 * @param onKeyDown     Optional capture-phase keydown listener.
 * @param onPointerDown Optional pointerdown listener for outside clicks.
 * @return Cleanup callback.
 */
export function bindElementorPreviewEvents(
	enabled: boolean,
	onKeyDown?: ( event: KeyboardEvent ) => void,
	onPointerDown?: () => void
): () => void {
	if ( ! enabled || ( ! onKeyDown && ! onPointerDown ) ) {
		return () => {};
	}

	let currentIframe: HTMLIFrameElement | null = null;
	let observedRoot: Node | null = null;
	let detachIframeWindow: ( () => void ) | null = null;

	const attachWindow = ( iframe: HTMLIFrameElement ) => {
		detachIframeWindow?.();
		detachIframeWindow = null;

		try {
			const win = iframe.contentWindow;
			if ( ! win ) {
				return;
			}

			const handleKeyDown = ( event: KeyboardEvent ) => {
				onKeyDown?.( event );
			};
			const handlePointerDown = () => {
				onPointerDown?.();
			};

			if ( onKeyDown ) {
				win.addEventListener( 'keydown', handleKeyDown, true );
			}
			if ( onPointerDown ) {
				win.addEventListener( 'pointerdown', handlePointerDown, true );
			}

			detachIframeWindow = () => {
				try {
					if ( onKeyDown ) {
						win.removeEventListener(
							'keydown',
							handleKeyDown,
							true
						);
					}
					if ( onPointerDown ) {
						win.removeEventListener(
							'pointerdown',
							handlePointerDown,
							true
						);
					}
				} catch {
					// Ignore cross-origin or torn-down iframe windows.
				}
			};
		} catch {
			// Ignore cross-origin iframe access.
		}
	};

	const handleIframeLoad = () => {
		if ( currentIframe ) {
			attachWindow( currentIframe );
		}
	};

	const syncIframe = () => {
		const nextIframe = document.getElementById(
			'elementor-preview-iframe'
		) as HTMLIFrameElement | null;

		if ( nextIframe === currentIframe ) {
			return;
		}

		currentIframe?.removeEventListener( 'load', handleIframeLoad );
		detachIframeWindow?.();
		detachIframeWindow = null;
		currentIframe = nextIframe;

		if ( currentIframe ) {
			currentIframe.addEventListener( 'load', handleIframeLoad );
			attachWindow( currentIframe );
		}
	};

	const updateObserverScope = () => {
		const nextRoot =
			currentIframe?.parentElement ??
			document.getElementById( 'elementor-preview-responsive-wrapper' ) ??
			document.body;

		if ( ! nextRoot || nextRoot === observedRoot ) {
			return;
		}

		observer.disconnect();
		observedRoot = nextRoot;
		observer.observe( nextRoot, {
			childList: true,
			subtree: nextRoot === document.body,
		} );
	};

	const observer = new MutationObserver( () => {
		syncIframe();
		updateObserverScope();
	} );

	syncIframe();
	updateObserverScope();

	return () => {
		observer.disconnect();
		currentIframe?.removeEventListener( 'load', handleIframeLoad );
		detachIframeWindow?.();
		detachIframeWindow = null;
		currentIframe = null;
		observedRoot = null;
	};
}
