import { useEffect, useLayoutEffect, useRef } from '@wordpress/element';
import { animate } from 'animejs';
import styles from './FloatingToolbar.module.css';

type MorphShellProps = {
	open: boolean;
	modeKey: string;
	width: number;
	radius?: number;
	anchorRef: React.RefObject< HTMLDivElement | null >;
	onCollapsed: () => void;
	maxHeight?: number;
	dynamicHeight?: boolean;
	children: React.ReactNode;
};

function getFadeTargets( content: HTMLElement ) {
	const header = content.querySelector< HTMLElement >(
		'[data-panel-header]'
	);
	const items = Array.from(
		content.querySelectorAll< HTMLElement >(
			'[role="menuitem"], [data-panel-fade]'
		)
	);
	return { header, items };
}

function MorphShell( {
	open,
	modeKey,
	width,
	radius = 13,
	anchorRef,
	onCollapsed,
	maxHeight,
	dynamicHeight = false,
	children,
}: MorphShellProps ) {
	const shellRef = useRef< HTMLDivElement >( null );
	const contentRef = useRef< HTMLDivElement >( null );
	const animationsRef = useRef< ReturnType< typeof animate >[] >( [] );
	const heightAnimRef = useRef< ReturnType< typeof animate > | null >( null );
	const openRef = useRef( open );
	const lastModeKeyRef = useRef< string | null >( null );
	const targetHeightRef = useRef( 0 );
	const onCollapsedRef = useRef( onCollapsed );
	onCollapsedRef.current = onCollapsed;

	useLayoutEffect( () => {
		const anchor = anchorRef.current;
		const shell = shellRef.current;
		const content = contentRef.current;
		if ( ! anchor || ! shell || ! content ) {
			return;
		}

		openRef.current = open;
		animationsRef.current.forEach( ( animation ) => animation.cancel() );
		animationsRef.current = [];
		heightAnimRef.current?.cancel();
		heightAnimRef.current = null;

		const anchorWidth = anchor.offsetWidth;
		const anchorHeight = anchor.offsetHeight;
		const pillRadius = Math.round( anchorHeight / 2 );
		const clampedWidth = Math.min(
			Math.max( anchorWidth, width ),
			window.innerWidth - 24
		);
		shell.style.setProperty(
			'--printah-popup-width',
			`${ clampedWidth }px`
		);
		const rawHeight = Math.max(
			content.offsetHeight,
			content.scrollHeight
		);
		const height = Math.max(
			anchorHeight,
			maxHeight ? Math.min( rawHeight, maxHeight ) : rawHeight
		);
		const reducedMotion = window.matchMedia(
			'(prefers-reduced-motion: reduce)'
		).matches;
		const { header, items } = getFadeTargets( content );

		const finishClose = () => {
			if ( openRef.current || shell.style.visibility === 'hidden' ) {
				return;
			}
			onCollapsedRef.current();
			requestAnimationFrame( () => {
				if ( ! openRef.current ) {
					shell.style.visibility = 'hidden';
				}
			} );
		};

		if ( open ) {
			const isHidden = getComputedStyle( shell ).visibility === 'hidden';
			const isModeChange = lastModeKeyRef.current !== modeKey;
			if ( isHidden ) {
				shell.style.width = `${ anchorWidth }px`;
				shell.style.height = `${ anchorHeight }px`;
				shell.style.borderRadius = `${ pillRadius }px`;
			}
			if ( header && ( isHidden || isModeChange ) ) {
				header.style.opacity = '0';
				header.style.transform = 'translateY(6px)';
			}
			items.forEach( ( item ) => {
				if ( isHidden || isModeChange || ! item.style.opacity ) {
					item.style.opacity = '0';
					item.style.transform = 'translateY(8px)';
				}
			} );
			shell.style.visibility = 'visible';
			shell.style.pointerEvents = 'auto';
			targetHeightRef.current = height;
			lastModeKeyRef.current = modeKey;

			if ( reducedMotion ) {
				shell.style.width = `${ clampedWidth }px`;
				shell.style.height = `${ height }px`;
				shell.style.borderRadius = `${ radius }px`;
				if ( header ) {
					header.style.opacity = '1';
					header.style.removeProperty( 'transform' );
				}
				items.forEach( ( item ) => {
					item.style.opacity = '1';
					item.style.removeProperty( 'transform' );
				} );
			} else {
				const nextAnimations: ReturnType< typeof animate >[] = [
					animate( shell, {
						width: clampedWidth,
						borderRadius: radius,
						duration: 185,
						ease: 'out(3)',
					} ),
				];
				heightAnimRef.current = animate( shell, {
					height,
					duration: 185,
					ease: 'out(3)',
				} );
				if ( header ) {
					nextAnimations.push(
						animate( header, {
							opacity: 1,
							y: 0,
							delay: 75,
							duration: 140,
							ease: 'out(3)',
						} )
					);
				}
				if ( items.length ) {
					nextAnimations.push(
						animate( items, {
							opacity: 1,
							y: 0,
							delay: ( _item?: unknown, index = 0 ) =>
								100 + index * 22,
							duration: 150,
							ease: 'out(3)',
						} )
					);
				}
				animationsRef.current = nextAnimations;
			}
		} else {
			lastModeKeyRef.current = null;
			targetHeightRef.current = anchorHeight;
			shell.style.pointerEvents = 'none';

			if ( reducedMotion ) {
				if ( getComputedStyle( shell ).visibility !== 'hidden' ) {
					onCollapsedRef.current();
					shell.style.visibility = 'hidden';
				}
			} else if ( getComputedStyle( shell ).visibility === 'hidden' ) {
				shell.style.visibility = 'hidden';
			} else {
				const nextAnimations: ReturnType< typeof animate >[] = [
					animate( shell, {
						width: anchorWidth,
						borderRadius: pillRadius,
						delay: 25,
						duration: 170,
						ease: 'out(3)',
						onComplete: finishClose,
					} ),
				];
				heightAnimRef.current = animate( shell, {
					height: anchorHeight,
					delay: 25,
					duration: 170,
					ease: 'out(3)',
				} );
				if ( header ) {
					nextAnimations.push(
						animate( header, {
							opacity: 0,
							y: 6,
							duration: 75,
							ease: 'out(2)',
						} )
					);
				}
				if ( items.length ) {
					nextAnimations.push(
						animate( items, {
							opacity: 0,
							y: 6,
							duration: 75,
							ease: 'out(2)',
						} )
					);
				}
				animationsRef.current = nextAnimations;
			}
		}

		return () => {
			animationsRef.current.forEach( ( animation ) =>
				animation.cancel()
			);
			heightAnimRef.current?.cancel();
		};
	}, [ open, modeKey, width, radius, maxHeight, anchorRef ] );

	useEffect( () => {
		if ( ! open || ! dynamicHeight ) {
			return;
		}
		const anchor = anchorRef.current;
		const shell = shellRef.current;
		const content = contentRef.current;
		if ( ! anchor || ! shell || ! content ) {
			return;
		}

		const updateHeight = () => {
			if ( ! openRef.current ) {
				return;
			}
			const anchorHeight = anchor.offsetHeight;
			const rawHeight = Math.max(
				content.offsetHeight,
				content.scrollHeight
			);
			const nextHeight = Math.max(
				anchorHeight,
				maxHeight ? Math.min( rawHeight, maxHeight ) : rawHeight
			);
			if ( Math.abs( nextHeight - targetHeightRef.current ) <= 1 ) {
				return;
			}
			targetHeightRef.current = nextHeight;
			heightAnimRef.current?.cancel();
			if (
				window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches
			) {
				shell.style.height = `${ nextHeight }px`;
			} else {
				heightAnimRef.current = animate( shell, {
					height: nextHeight,
					duration: 135,
					ease: 'out(3)',
				} );
			}
		};

		const observer = new ResizeObserver( updateHeight );
		observer.observe( content );
		return () => {
			observer.disconnect();
		};
	}, [ open, dynamicHeight, maxHeight, anchorRef ] );

	return (
		<div
			ref={ shellRef }
			className={ styles.popupShell }
			data-printah-popup
			aria-hidden={ ! open }
			inert={ ! open }
		>
			<div ref={ contentRef } className={ styles.popupContent }>
				{ children }
			</div>
		</div>
	);
}

export default MorphShell;
