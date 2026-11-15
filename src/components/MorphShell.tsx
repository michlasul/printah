import { useEffect, useLayoutEffect, useRef } from '@wordpress/element';
import { animate, createSpring } from 'animejs';
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

function clearEffects( targets: HTMLElement[] ) {
	targets.forEach( ( target ) => {
		target.style.removeProperty( 'transform' );
		target.style.removeProperty( 'filter' );
		target.style.removeProperty( 'will-change' );
	} );
}

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
		const rawHeight = content.offsetHeight;
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
			clearEffects( [
				shell,
				...( header ? [ header ] : [] ),
				...items,
			] );
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
				shell.style.transform = 'scale(0.95)';
			}
			if ( header && ( isHidden || isModeChange ) ) {
				header.style.opacity = '0';
				header.style.filter = 'blur(7px)';
				header.style.transform = 'translateY(3px) scale(0.95)';
			}
			items.forEach( ( item ) => {
				if ( isHidden || isModeChange || ! item.style.opacity ) {
					item.style.opacity = '0';
					item.style.filter = 'blur(7px)';
					item.style.transform = 'translateY(3px) scale(0.95)';
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
				clearEffects( [ shell ] );
				if ( header ) {
					header.style.opacity = '1';
					clearEffects( [ header ] );
				}
				items.forEach( ( item ) => {
					item.style.opacity = '1';
				} );
				clearEffects( items );
			} else {
				shell.style.willChange =
					'width, height, border-radius, transform';
				if ( header ) {
					header.style.willChange = 'filter, opacity, transform';
				}
				items.forEach( ( item ) => {
					item.style.willChange = 'filter, opacity, transform';
				} );
				const geometrySpring = createSpring( {
					bounce: 0.24,
					duration: 420,
				} );
				const flexSpring = createSpring( {
					bounce: 0.3,
					duration: 450,
				} );
				const contentSpring = createSpring( {
					bounce: 0.16,
					duration: 310,
				} );
				const baseDelay = isHidden ? 80 : 40;
				const nextAnimations: ReturnType< typeof animate >[] = [
					animate( shell, {
						width: clampedWidth,
						borderRadius: radius,
						ease: geometrySpring,
					} ),
					animate( shell, {
						scale: 1,
						ease: flexSpring,
						onComplete: () => {
							if ( openRef.current ) {
								clearEffects( [ shell ] );
							}
						},
					} ),
				];
				heightAnimRef.current = animate( shell, {
					height,
					ease: geometrySpring,
				} );
				if ( header ) {
					const headerDelay = baseDelay + items.length * 12;
					nextAnimations.push(
						animate( header, {
							opacity: 1,
							filter: 'blur(0px)',
							delay: headerDelay,
							duration: 215,
							ease: 'out(3)',
							onComplete: () => {
								if ( openRef.current ) {
									header.style.removeProperty( 'filter' );
									header.style.removeProperty(
										'will-change'
									);
								}
							},
						} ),
						animate( header, {
							y: 0,
							scale: 1,
							delay: headerDelay,
							ease: contentSpring,
							onComplete: () => {
								if ( openRef.current ) {
									header.style.removeProperty( 'transform' );
									header.style.removeProperty(
										'will-change'
									);
								}
							},
						} )
					);
				}
				if ( items.length ) {
					const itemDelay = ( _item?: unknown, index = 0 ) =>
						baseDelay + ( items.length - 1 - index ) * 12;
					nextAnimations.push(
						animate( items, {
							opacity: 1,
							filter: 'blur(0px)',
							delay: itemDelay,
							duration: 215,
							ease: 'out(3)',
							onComplete: () => {
								if ( openRef.current ) {
									items.forEach( ( item ) => {
										item.style.removeProperty( 'filter' );
										item.style.removeProperty(
											'will-change'
										);
									} );
								}
							},
						} ),
						animate( items, {
							y: 0,
							scale: 1,
							delay: itemDelay,
							ease: contentSpring,
							onComplete: () => {
								if ( openRef.current ) {
									items.forEach( ( item ) => {
										item.style.removeProperty(
											'transform'
										);
										item.style.removeProperty(
											'will-change'
										);
									} );
								}
							},
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
				clearEffects( [
					shell,
					...( header ? [ header ] : [] ),
					...items,
				] );
				if ( getComputedStyle( shell ).visibility !== 'hidden' ) {
					onCollapsedRef.current();
					shell.style.visibility = 'hidden';
				}
			} else if ( getComputedStyle( shell ).visibility === 'hidden' ) {
				clearEffects( [
					shell,
					...( header ? [ header ] : [] ),
					...items,
				] );
				shell.style.visibility = 'hidden';
			} else {
				shell.style.willChange =
					'width, height, border-radius, transform';
				if ( header ) {
					header.style.willChange = 'filter, opacity, transform';
				}
				items.forEach( ( item ) => {
					item.style.willChange = 'filter, opacity, transform';
				} );
				const closeSpring = createSpring( {
					bounce: 0.14,
					duration: 290,
				} );
				const nextAnimations: ReturnType< typeof animate >[] = [
					animate( shell, {
						width: anchorWidth,
						borderRadius: pillRadius,
						scale: 1,
						delay: 15,
						ease: closeSpring,
						onComplete: finishClose,
					} ),
				];
				heightAnimRef.current = animate( shell, {
					height: anchorHeight,
					delay: 15,
					ease: closeSpring,
				} );
				if ( header ) {
					nextAnimations.push(
						animate( header, {
							opacity: 0,
							filter: 'blur(7px)',
							y: 2,
							scale: 0.94,
							duration: 115,
							ease: 'out(2)',
						} )
					);
				}
				if ( items.length ) {
					nextAnimations.push(
						animate( items, {
							opacity: 0,
							filter: 'blur(7px)',
							y: 2,
							scale: 0.94,
							duration: 115,
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
			const rawHeight = content.offsetHeight;
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
					ease: createSpring( {
						bounce: 0.16,
						duration: 280,
					} ),
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
