import { ParserPointer } from '../utils/ParserPointer';
import { Expression } from './Expression';

export class Array {
	constructor(private pointer: ParserPointer, private expression: Expression) {}

	array() {
		const { pointer } = this;

		return null;

		return {
			type: 'Array',
			values,
		};
	}
}
