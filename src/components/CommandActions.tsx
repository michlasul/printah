import { __, sprintf } from '@wordpress/i18n';
import { ArrowUpRight, Eye, FileText, PenLine } from 'lucide-react';
import type { Command } from '../commands/types';
import styles from './CommandPalette.module.css';

export type DrilldownActionItem = {
	id: string;
	label: string;
	description: string;
	url: string;
	icon: 'view' | 'elementor' | 'primary';
};

export function getPrimaryCommandAction(
	command?: Command,
	preferElementor = false
): { label: string; url?: string } {
	if ( ! command ) {
		return { label: __( 'Open Page', 'printah' ) };
	}

	if ( preferElementor ) {
		const elementorAction = command.actions?.find(
			( action ) => action.id === 'elementor'
		);
		if ( elementorAction ) {
			return {
				label: elementorAction.label,
				url: elementorAction.url,
			};
		}
	}

	return {
		label: command.postType
			? __( 'Edit Content', 'printah' )
			: __( 'Open Page', 'printah' ),
		url: command.url,
	};
}

export function buildCommandActionItems(
	command: Command,
	preferElementor = false
): DrilldownActionItem[] {
	const secondary: DrilldownActionItem[] = ( command.actions ?? [] ).map(
		( action ) => ( {
			id: action.id,
			label: action.label,
			description:
				action.id === 'elementor'
					? __( 'Open in Elementor editor', 'printah' )
					: __( 'Open on site', 'printah' ),
			url: action.url,
			icon: action.id,
		} )
	);

	const wpAction: DrilldownActionItem = {
		id: 'primary',
		label: command.postType
			? __( 'Edit Content', 'printah' )
			: __( 'Open Page', 'printah' ),
		description: command.postType
			? __( 'Open in WordPress editor', 'printah' )
			: command.description,
		url: command.url,
		icon: 'primary',
	};

	if ( preferElementor ) {
		const otherActions = secondary.filter(
			( action ) => action.id !== 'elementor'
		);
		const elementorAction = secondary.find(
			( action ) => action.id === 'elementor'
		);
		return elementorAction
			? [ wpAction, ...otherActions, elementorAction ]
			: [ ...otherActions, wpAction ];
	}

	return [ ...secondary, wpAction ];
}

const actionIcons = {
	view: Eye,
	elementor: PenLine,
	primary: FileText,
};

type Props = {
	commandLabel: string;
	actions: DrilldownActionItem[];
	selectedIndex: number;
	onHover: ( index: number ) => void;
	onSelect: ( action: DrilldownActionItem ) => void;
};

export default function CommandActions( {
	commandLabel,
	actions,
	selectedIndex,
	onHover,
	onSelect,
}: Props ) {
	if ( ! actions.length ) {
		return (
			<div className={ styles[ 'printah-empty' ] }>
				<strong>{ __( 'No matching actions', 'printah' ) }</strong>
				<span>
					{ __(
						'Try another keyword or press Esc to go back.',
						'printah'
					) }
				</span>
			</div>
		);
	}

	const reversed = actions
		.map( ( action, index ) => ( { action, index } ) )
		.reverse();

	const groupLabel = sprintf(
		/* translators: %s: command label. */
		__( 'Actions · %s', 'printah' ),
		commandLabel
	);

	const regionLabel = sprintf(
		/* translators: %s: command label. */
		__( 'Actions for %s', 'printah' ),
		commandLabel
	);

	return (
		<section aria-label={ regionLabel }>
			<h2
				id="printah-actions-group-heading"
				className={ styles[ 'printah-group-title' ] }
			>
				{ groupLabel }
			</h2>
			<ul
				id="printah-results-listbox"
				role="listbox"
				aria-label={ regionLabel }
			>
				{ reversed.map( ( { action, index } ) => {
					const Icon = actionIcons[ action.icon ];
					const isSelected = index === selectedIndex;
					return (
						<li key={ action.id } role="presentation">
							<div
								className={ `${ styles[ 'printah-result-row' ] }${
									isSelected
										? ` ${ styles[ 'is-selected' ] }`
										: ''
								}` }
								data-selected={ isSelected }
							>
								<button
									id={ `printah-action-option-${ action.id }` }
									role="option"
									aria-selected={ isSelected }
									className={ styles[ 'printah-result' ] }
									type="button"
									onMouseEnter={ () => onHover( index ) }
									onClick={ () => onSelect( action ) }
								>
									<span
										className={
											styles[ 'printah-result__icon' ]
										}
										aria-hidden="true"
									>
										<Icon size={ 16 } strokeWidth={ 1.9 } />
									</span>
									<span
										className={
											styles[ 'printah-result__content' ]
										}
									>
										<strong>{ action.label }</strong>
										<small>{ action.description }</small>
									</span>
									<span
										className={
											styles[ 'printah-result__type' ]
										}
										aria-hidden="true"
									>
										<ArrowUpRight size={ 14 } />
									</span>
								</button>
							</div>
						</li>
					);
				} ) }
			</ul>
		</section>
	);
}
