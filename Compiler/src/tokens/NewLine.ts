import { Pointer } from '../utils/Pointer';

export class NewLine {
	constructor(private pointer: Pointer) {}

	newline() {
		if (this.pointer.char != '\n') return null;

		this.pointer.next();
		this.pointer.nextLine();

		return {
			type: 'NewLine',
			ctx: this.pointer.context(),
		};
	}
}
