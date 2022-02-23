import { Pointer } from '../utils/Pointer';

export class Colon {
	constructor(private pointer: Pointer) {}

	comma() {
		if (this.pointer.char != ',') return null;

		this.pointer.next();

		return {
			type: 'Comma',
			value: ',',
			ctx: this.pointer.context(),
		};
	}

	colon() {
		if (this.pointer.char != ':') return null;

		this.pointer.next();

		return {
			type: 'Colon',
			value: ':',
			ctx: this.pointer.context(),
		};
	}

	semicolon() {
		if (this.pointer.char != ';') return null;

		this.pointer.next();

		return {
			type: 'Semicolon',
			value: ';',
			ctx: this.pointer.context(),
		};
	}
}
