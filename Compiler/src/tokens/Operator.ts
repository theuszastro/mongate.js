import { Token } from '../types/token';
import { Pointer } from '../utils/Pointer';

export class Operator {
	constructor(private pointer: Pointer) {}

	operator(): Token | undefined {
		const { pointer } = this;

		if (!['+', '-', '/', '*', '%'].includes(pointer.char)) return;

		const value = pointer.char;
		pointer.next();

		return {
			type: 'Operator',
			value,
			ctx: pointer.context(),
		};
	}
}
