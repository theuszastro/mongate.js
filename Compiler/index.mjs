import fs from 'fs/promises';
import { Compiler } from './src/compiler.mjs';

(async () => {
	const content = await fs.readFile('./data.mon', 'utf-8');

	const compiler = new Compiler('data.mon', content);

	compiler.run();
})();
