/**
 * Static Site Generation — prerender all routes to HTML at build time.
 * Runs after `vite build --ssr` to produce static HTML with real content
 * instead of an empty <div id="root">.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dist = path.resolve(root, 'dist');
const distSSR = path.resolve(root, 'dist-ssr');

// All routes that should be prerendered
const routes = [
  '/',
  '/login',
  '/register',
  '/demo',
  '/auftraege',
  '/kunden',
  '/fahrzeuge',
  '/einstellungen',
];

async function prerender() {
  const template = fs.readFileSync(path.resolve(dist, 'index.html'), 'utf-8');
  const { render } = await import(path.resolve(distSSR, 'entry-server.js'));

  for (const url of routes) {
    const { html: appHtml } = render(url);

    // Replace the SSR outlet with rendered HTML
    const finalHtml = template.replace('<!--ssr-outlet-->', appHtml);

    // Determine output path
    const filePath =
      url === '/'
        ? path.resolve(dist, 'index.html')
        : path.resolve(dist, url.slice(1), 'index.html');

    // Create directory if needed
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, finalHtml);
    console.log(`  prerendered: ${url} → ${path.relative(root, filePath)}`);
  }

  console.log(`\n  ${routes.length} routes prerendered successfully.\n`);
}

prerender().catch((err) => {
  console.error('Prerender failed:', err);
  process.exit(1);
});
