import type { Handle, HandleServerError } from '@sveltejs/kit';

function genNonce(len = 16) {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, b => b.toString(16).padStart(2,'0')).join('');
}

export const handle: Handle = async ({ event, resolve }) => {
  const nonce = genNonce();
  event.locals.cspNonce = nonce;
  return resolve(event, {
    transformPageChunk: ({ html }) => html.replace('%csp.nonce%', nonce)
  });
};

export const handleError: HandleServerError = ({ error, event }) => {
  const err = error as any;
  console.error('Server Error:', { path: event.url.pathname, message: err?.message });
  return { message: err?.message || 'Server Error' };
};
