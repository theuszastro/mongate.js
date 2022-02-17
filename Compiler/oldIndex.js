const asts = [];

let line = 0;

function parseFunction(token) {
	const node = {
		type: 'function',
		value: token,
		expressions: [],
	};

	asts.push(node);
}

function parseOperator(token) {
	if (asts.length > 0) {
		const last = asts[asts.length - 1];

		if (last.type === 'number') {
			const lastExpression = last.expressions[last.expressions.length - 1];

			if (lastExpression.type === 'operator')
				throw new Error(`Invalid expression ${lastExpression.value} in line ${line}`);

			last.expression.push({
				type: 'operator',
				value: token,
				expressions: [],
			});
		}
	}
}

function parseReturn(token) {
	const last = asts[asts.length - 1];

	if (last.type === 'function') {
		last.expressions.push({
			type: 'return',
			value: token,
			expressions: [],
		});
	}
}

function parseFunctionParam(token) {
	return {
		type: 'param',
		value: token,
		expressions: [],
	};
}

function parseText(token) {
	const last = asts[asts.length - 1];
	const lastExpression = last.expressions[last.expressions.length - 1];

	switch (last.type) {
		case 'function':
			if (!lastExpression) {
				last.expressions.push({
					type: 'name',
					value: token,
					expressions: [],
				});

				break;
			}
	}

	if (lastExpression) {
		if (token === ',') {
			last.expressions.push({
				type: 'separator',
				value: ',',
				expressions: [],
			});
		}

		switch (lastExpression.type) {
			case 'name':
				last.expressions.push(parseFunctionParam(token));

				break;

			case 'separator':
				last.expressions.push({
					type: 'param',
					value: token,
					expressions: [],
				});

				break;
		}
	}
}

const parseExpression = token => {
	switch (token) {
		case '+':
		case '-':
		case '*':
		case '/':
			return parseOperator(token);

		case 'def':
			return parseFunction(token);

		case 'return':
			return parseReturn(token);

		default:
			return parseText(token);
	}
};
