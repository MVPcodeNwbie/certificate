import { describe, it, expect } from 'vitest';
import { theme, toggleTheme } from '../src/lib/presentation/stores/theme';

// NOTE: This is a simple store test; DOM class toggling cannot be asserted here without jsdom.

describe('theme toggle store', () => {
  it('toggles between light and dark', () => {
    let current: any;
    const unsub = theme.subscribe(v => current = v);
    const first = current;
    toggleTheme();
    const second = current;
    expect(second).not.toEqual(first);
    toggleTheme();
    const third = current;
    expect(third).toEqual(first);
    unsub();
  });
});
