import { Pointer } from '../utils/Pointer';

export class Colon {
	constructor(private pointer: Pointer) {}

	colon() {
		if (this.pointer.char != ',') return null;

		this.pointer.next();

		return {
			type: 'Colon',
			ctx: this.pointer.context(),
		};
	}

	semicolon() {
		if (this.pointer.char != ';') return null;

		this.pointer.next();

		return {
			type: 'Semicolon',
			ctx: this.pointer.context(),
		};
	}
}
