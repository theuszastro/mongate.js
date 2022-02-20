import { Pointer } from '../utils/Pointer';

export class OperatorLogic {
	constructor(private pointer: Pointer) {}

	private operators = {
		'=': 'Assignment',
		'!': 'Not',
		'|': 'Or',
		'&': 'And',
		'<': 'LessThan',
		'>': 'GreaterThan',
		'?': 'Optional',
		'.': 'Dot',
	} as { [key: string]: string };

	operatorLogic() {
		const { pointer } = this;

		const operator = this.operators[pointer.char];
		if (!operator) return null;

		const value = pointer.char;
		pointer.next();

		return {
			type: operator,
			value,
			ctx: pointer.context(),
		};
	}
}
