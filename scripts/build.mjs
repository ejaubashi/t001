import { cp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
const root = path.resolve(import.meta.dirname, '..');
const base = (process.env.BASE_PATH || '').replace(/\/$/, '');
if (base && !/^\/[A-Za-z0-9_/-]+$/.test(base)) throw new Error('BASE_PATH must be an absolute URL path');
const output = path.join(root, 'dist');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(path.join(root, 'public'), output, { recursive: true });
const modules = ['app.js','motion.js','media-flow.js','elastic.js','living-focus.js','filament.js'];
const hash = createHash('sha256');
for (const name of [...modules,'style.css']) hash.update(await readFile(path.join(output,name)));
const revision = hash.digest('hex').slice(0,12);
for (const name of modules) {
  const source = await readFile(path.join(output,name),'utf8');
  await writeFile(path.join(output,name),source.replace(/from (['"])(\.\/[^'"]+\.js)\1/g, (_,q,url)=>`from ${q}${url}?v=${revision}${q}`));
}
let html = await readFile(path.join(output, 'index.html'), 'utf8');
html = html.replace('<head>', `<head>\n<script>window.__PORTFOLIO_BASE__=${JSON.stringify(base)};</script>`)
  .replaceAll('href="/', `href="${base}/`).replaceAll('src="/', `src="${base}/`)
  .replace(/(app\.js|style\.css)"/g, `$1?v=${revision}"`);
await writeFile(path.join(output, 'index.html'), html);
await writeFile(path.join(output, '404.html'), html);
await mkdir(path.join(output,'focus'),{recursive:true});
await writeFile(path.join(output,'focus','index.html'),html);
for(const name of ['elastic','gallery']){await mkdir(path.join(output,name),{recursive:true});await writeFile(path.join(output,name,'index.html'),html);}
let css = await readFile(path.join(output, 'style.css'), 'utf8');
await writeFile(path.join(output, 'style.css'), css.replaceAll("url('/", `url('${base}/`));
await writeFile(path.join(output, '.nojekyll'), '');
console.log(`Static site built in dist with base path ${base || '/'}`);
