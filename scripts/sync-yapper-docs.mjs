// Copies Yapper's documentation from the Unity package into the site.
//
// The package's Documentation~ folder is the only place the docs are edited. This script turns each file into a
// Starlight page under src/content/docs/yapper/ (which is committed, so Vercel can build without access to the
// private Yapper repo). Run it after changing the docs, then commit:
//
//   npm run sync-docs
//
// Set YAPPER_DOCS to read from somewhere other than the default local checkout.

import { readdir, readFile, writeFile, rm, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const source = path.resolve(
	root,
	process.env.YAPPER_DOCS ?? '../../UnityProjects/Yapper/Packages/com.kirranator.yapper/Documentation~'
);
const target = path.join(root, 'src/content/docs/yapper');

// Yapper.md is the overview, so it becomes /yapper/. Every other file becomes /yapper/<kebab-case-name>/.
const slugFor = (file) => {
	const name = path.basename(file, '.md');
	if (name === 'Yapper') return '';
	if (name === 'API') return 'api';
	return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
};
const urlFor = (file) => `/yapper/${slugFor(file) ? slugFor(file) + '/' : ''}`;

function convert(markdown, file) {
	const lines = markdown.replace(/\r\n/g, '\n').split('\n');
	const h1 = lines.findIndex((l) => l.startsWith('# '));
	if (h1 < 0) throw new Error(`${file} has no "# Title" line.`);
	const title = lines[h1].slice(2).trim();
	lines.splice(h1, 1);

	// Rewrite links between doc files (Integration.md#anchor -> /yapper/integration/#anchor), outside code blocks.
	let inCode = false;
	const body = lines
		.map((line) => {
			if (/^\s*(```|~~~)/.test(line)) inCode = !inCode;
			if (inCode) return line;
			return line.replace(/\]\(([A-Za-z]+\.md)(#[^)]*)?\)/g, (_, target, anchor = '') => `](${urlFor(target)}${anchor})`);
		})
		.join('\n')
		.replace(/^\n+/, '');

	return [
		'---',
		`# Generated from Yapper's Documentation~/${file} by scripts/sync-yapper-docs.mjs. Edit the original, not this copy.`,
		`title: ${JSON.stringify(title)}`,
		// The overview's title matches the site title, so give its browser tab a clearer name than "Yapper | Yapper".
		...(slugFor(file) === '' ? ['head:', '  - tag: title', '    content: "Yapper | Documentation"'] : []),
		'---',
		'',
		body,
	].join('\n');
}

const files = (await readdir(source)).filter((f) => f.endsWith('.md'));
if (!files.includes('Yapper.md')) throw new Error(`No Yapper.md in ${source}. Is YAPPER_DOCS right?`);

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
for (const file of files) {
	const out = path.join(target, (slugFor(file) || 'index') + '.md');
	await writeFile(out, convert(await readFile(path.join(source, file), 'utf8'), file));
	console.log(`${file} -> ${path.relative(root, out)}`);
}
