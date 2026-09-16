import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('web');
const revision = process.env.WORKERS_CI_COMMIT_SHA
  || process.env.CF_PAGES_COMMIT_SHA
  || process.env.GITHUB_SHA
  || process.env.COMMIT_SHA;

if (!revision) {
  throw new Error('No commit SHA found. Set WORKERS_CI_COMMIT_SHA, CF_PAGES_COMMIT_SHA, GITHUB_SHA, or COMMIT_SHA.');
}

const textExtensions = new Set(['.html', '.js', '.css', '.json', '.webmanifest']);

async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await visit(fullPath);
      continue;
    }
    if (!textExtensions.has(path.extname(entry.name))) continue;

    const source = await readFile(fullPath, 'utf8');
    if (!source.includes('__COMMIT_SHA__')) continue;
    await writeFile(fullPath, source.replaceAll('__COMMIT_SHA__', revision), 'utf8');
  }
}

await visit(root);
console.log(`Stamped ${revision} into web assets.`);
