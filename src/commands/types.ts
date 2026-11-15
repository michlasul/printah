export type Category =
	'utama' | 'konten' | 'situs' | 'pengaturan' | 'elementor' | 'toko';

export type CommandAction = {
	id: 'view' | 'elementor';
	label: string;
	url: string;
};

export type Command = {
	id: string;
	label: string;
	description: string;
	keywords: string[];
	url: string;
	category?: Category;
	postType?: string;
	actions?: CommandAction[];
};
