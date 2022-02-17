import fs from 'fs/promises';
import { compiler } from './src/compiler.mjs';

(async () => {
	const content = await fs.readFile('./data.moon', 'utf-8');

	compiler('data.moon', content);
})();
