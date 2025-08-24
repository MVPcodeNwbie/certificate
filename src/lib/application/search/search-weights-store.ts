import { writable } from 'svelte/store';
import type { SearchWeightConfig } from '$lib/domain/search/scoring';
import { defaultSearchWeights } from '$lib/domain/search/scoring';

// Persist user custom weights (localStorage) for advanced tuner UI
const LS_KEY = 'searchWeights:v1';

function loadInitial(): SearchWeightConfig {
  if (typeof localStorage === 'undefined') return defaultSearchWeights;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return defaultSearchWeights;
    const parsed = JSON.parse(raw);
    return { ...defaultSearchWeights, ...parsed };
  } catch { return defaultSearchWeights; }
}

export const searchWeights = writable<SearchWeightConfig>(loadInitial());

searchWeights.subscribe(v => {
  try { if (typeof localStorage !== 'undefined') localStorage.setItem(LS_KEY, JSON.stringify(v)); } catch {}
});

export function resetSearchWeights() { searchWeights.set(defaultSearchWeights); }