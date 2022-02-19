import { Pointer } from '../utils/Pointer';

export class Operator {
	constructor(private pointer: Pointer) {}

	operator() {
		const { pointer } = this;

		if (!['+', '-', '/', '*', '%'].includes(pointer.char)) return null;

		const value = pointer.char;
		pointer.next();

		return {
			type: 'Operator',
			value,
			ctx: pointer.context(),
		};
	}
}
