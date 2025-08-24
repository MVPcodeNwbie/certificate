import { writable } from 'svelte/store';

export interface Toast {
  id: string;
  type: 'info' | 'success' | 'error' | 'warn';
  message: string;
  title?: string;
  timeout?: number;
}

function createToastStore() {
  const { subscribe, update } = writable<Toast[]>([]);

  function push(t: Omit<Toast, 'id'>) {
    const id = crypto.randomUUID();
    const toast: Toast = { timeout: 4000, ...t, id };
    update(list => [...list, toast]);
    if (toast.timeout) {
      setTimeout(() => dismiss(id), toast.timeout);
    }
    return id;
  }
  function dismiss(id: string) {
    update(list => list.filter(t => t.id !== id));
  }

  return { subscribe, push, dismiss };
}

export const toasts = createToastStore();

export const toast = {
  info: (message: string, title?: string) => toasts.push({ type: 'info', message, title }),
  success: (message: string, title?: string) => toasts.push({ type: 'success', message, title }),
  error: (message: string, title?: string) => toasts.push({ type: 'error', message, title }),
  warn: (message: string, title?: string) => toasts.push({ type: 'warn', message, title })
};