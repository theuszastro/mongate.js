import { Token } from '../types/token';
import { Pointer } from '../utils/Pointer';

export class NewLine {
	constructor(private pointer: Pointer) {}

	newline(): Token | undefined {
		if (this.pointer.char != '\n') return;

		this.pointer.next();
		this.pointer.nextLine();

		return {
			type: 'NewLine',
			value: '\n',
			ctx: this.pointer.context(),
		};
	}
}
