import fs from 'fs/promises';

import { Compiler } from './src/compiler';

(async () => {
	const content = await fs.readFile('./data.nylock', 'utf-8');

	const compiler = new Compiler({
		content,
		filename: 'data.nylock',
	});

	compiler.run();
})();
