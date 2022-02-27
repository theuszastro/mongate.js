import { SyntaxError } from '../errors/SyntaxError';
import { ParsedToken } from '../types/parsedToken';

import { ParserPointer } from '../utils/ParserPointer';

import { _Function } from './Function';

export class Class {
	constructor(private pointer: ParserPointer, private func: _Function, private stmt: Function) {}

	private readBody() {
		const { pointer } = this;

		const body: ParsedToken[] = [];

		for (;;) {
			if (!pointer.token || pointer.take('EndFile') || pointer.take('EndKeyword')) break;

			const method = this.func.functionDeclaration(true);
			if (method) {
				body.push(method);

				continue;
			}

			// break;
		}

		return body;
	}

	_class() {
		const { pointer } = this;
		if (!pointer.token || !pointer.take('ClassKeyword')) return null;

		const name = pointer.take('Identifier');
		if (!name)
			new SyntaxError(pointer, {
				lineError: pointer.line,
				reason: `Expected a class name`,
			});

		const extendsClass = pointer.take('ExtendsKeyword');
		if (extendsClass) {
		}

		const body = this.readBody();

		return {
			type: 'ClassDeclaration',
			name,
			body,
		};
	}
}
