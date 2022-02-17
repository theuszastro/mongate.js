const parser = tokens => {
	let current_token_index = 0;

	const parseNumber = () => {
		return {
			value: parseInt(tokens[current_token_index++]),
			type: 'number',
		};
	};

	const parseOperator = () => {
		const node = { value: tokens[current_token_index++], type: 'operator', expression: [] };

		while (tokens[current_token_index]) {
			node.expression.push(parseExpression());
		}

		return node;
	};

	const parseExpression = () =>
		/\d/.test(tokens[current_token_index]) ? parseNumber() : parseOperator();

	return parseExpression();
};

const transpile = ast => {
	const mapOperator = { add: '+', sub: '-', mul: '*', div: '/' };
	const transpileNode = ast =>
		ast.type === 'number' ? transpileNumber(ast) : transpileOperator(ast);

	const transpileNumber = ast => ast.value;
	const transpileOperator = ast =>
		`${ast.expression.map(transpileNode).join(' ' + mapOperator[ast.value] + ' ')}`;

	return transpileOperator(ast);
};

// let result = a + b;
// let teste = 0;
// const random = false;
// const random01 = true;
