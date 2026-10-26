import { cp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const base = (process.env.BASE_PATH || '').replace(/\/$/, '');
if (base && !/^\/[A-Za-z0-9_/-]+$/.test(base)) throw new Error('BASE_PATH must be an absolute URL path');
const output = path.join(root, 'dist');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(path.join(root, 'public'), output, { recursive: true });
let html = await readFile(path.join(output, 'index.html'), 'utf8');
html = html.replace('<head>', `<head>\n<script>window.__PORTFOLIO_BASE__=${JSON.stringify(base)};</script>`)
  .replaceAll('href="/', `href="${base}/`).replaceAll('src="/', `src="${base}/`);
await writeFile(path.join(output, 'index.html'), html);
await writeFile(path.join(output, '404.html'), html);
let css = await readFile(path.join(output, 'style.css'), 'utf8');
await writeFile(path.join(output, 'style.css'), css.replaceAll("url('/", `url('${base}/`));
await writeFile(path.join(output, '.nojekyll'), '');
console.log(`Static site built in dist with base path ${base || '/'}`);
