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

export function buildCommandActionItems(
	command: Command
): DrilldownActionItem[] {
	const secondary: DrilldownActionItem[] = ( command.actions ?? [] ).map(
		( action ) => ( {
			id: action.id,
			label: action.label,
			description:
				action.id === 'elementor'
					? 'Open in Elementor editor'
					: 'Open on site',
			url: action.url,
			icon: action.id,
		} )
	);

	return [
		...secondary,
		{
			id: 'primary',
			label: command.postType ? 'Edit Content' : 'Open Page',
			description: command.postType
				? 'Open in WordPress editor'
				: command.description,
			url: command.url,
			icon: 'primary',
		},
	];
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
				<strong>No matching actions</strong>
				<span>Try another keyword or press Esc to go back.</span>
			</div>
		);
	}

	const reversed = actions
		.map( ( action, index ) => ( { action, index } ) )
		.reverse();

	return (
		<section aria-label={ `Actions for ${ commandLabel }` }>
			<h2 className={ styles[ 'printah-group-title' ] }>
				Actions · { commandLabel }
			</h2>
			<ul>
				{ reversed.map( ( { action, index } ) => {
					const Icon = actionIcons[ action.icon ];
					const isSelected = index === selectedIndex;
					return (
						<li key={ action.id }>
							<div
								className={ `${ styles[ 'printah-result-row' ] }${
									isSelected
										? ` ${ styles[ 'is-selected' ] }`
										: ''
								}` }
								data-selected={ isSelected }
							>
								<button
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
