// Simple in-memory event bus (client/runtime only). Can be swapped with more robust impl later.
export type EventHandler<T> = (event: T) => void | Promise<void>;

interface Subscription<T> { type: string; handler: EventHandler<T>; }

const handlers: Subscription<any>[] = [];
let debug = false;

export function enableEventBusDebug(v = true) { debug = v; }

export function on<T = any>(type: string, handler: EventHandler<T>) {
  handlers.push({ type, handler });
}

export function off<T = any>(type: string, handler: EventHandler<T>) {
  const idx = handlers.findIndex(h => h.type === type && h.handler === handler);
  if (idx >= 0) handlers.splice(idx, 1);
}

export async function emit<T = any>(type: string, event: T) {
  const subs = handlers.filter(h => h.type === type);
  if (debug) console.log('[event-bus] emit', type, 'to', subs.length, 'handlers');
  for (const sub of subs) {
    try {
      await sub.handler(event);
    } catch (e) {
      console.warn('[event-bus] handler error for', type, e);
    }
  }
}

export function handlerCount(type?: string) {
  return type ? handlers.filter(h => h.type === type).length : handlers.length;
}
