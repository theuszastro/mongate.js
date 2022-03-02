import { Token } from '../types/token';
import { Pointer } from '../utils/Pointer';

export class Colon {
	constructor(private pointer: Pointer) {}

	comma(): Token | undefined {
		if (this.pointer.char != ',') return;

		this.pointer.next();

		return {
			type: 'Comma',
			value: ',',
			ctx: this.pointer.context(),
		};
	}

	colon(): Token | undefined {
		if (this.pointer.char != ':') return;

		this.pointer.next();

		return {
			type: 'Colon',
			value: ':',
			ctx: this.pointer.context(),
		};
	}

	semicolon(): Token | undefined {
		if (this.pointer.char != ';') return;

		this.pointer.next();

		return {
			type: 'Semicolon',
			value: ';',
			ctx: this.pointer.context(),
		};
	}
}
