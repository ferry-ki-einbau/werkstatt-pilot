import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import AppSSR from './AppSSR';

export function render(url: string) {
  const html = renderToString(
    <StaticRouter location={url}>
      <AppSSR />
    </StaticRouter>
  );
  return { html };
}
