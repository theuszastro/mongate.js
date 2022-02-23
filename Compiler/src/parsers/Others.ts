import { ParserPointer, Token } from '../utils/ParserPointer';

export class Others {
	constructor(private pointer: ParserPointer) {}

	private scape() {
		const { pointer } = this;

		if (!pointer.token || pointer.token.type != 'BackSlash') return null;

		const next = pointer.previewNext(true, false);
		if (!next || next.type == 'Whitespace' || next.type == 'EndFile') return null;

		pointer.take('BackSlash');

		const value = pointer.token;
		if (!value) return null;

		pointer.take((value as Token).type);

		return {
			type: 'ScapeCarecter',
			value: `\\${(value as Token).value}`,
		};
	}

	others() {
		return this.scape();
	}
}
