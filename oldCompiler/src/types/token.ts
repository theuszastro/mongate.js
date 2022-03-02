export type Token = {
	type: string;
	value: Token | string;
	ctx: {
		file: string;
		line: number;
		column: number;
	};
};
