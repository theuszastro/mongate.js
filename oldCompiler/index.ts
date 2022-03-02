import fs from 'fs/promises';

import { Compiler } from './src/compiler';

(async () => {
	const content = await fs.readFile('./data.nylock', 'utf-8');

	const compiler = new Compiler();
	compiler.run({
		content,
		filename: 'data.nylock',
	});
})();
