import { describe, it, expect } from 'vitest';
import { filterEvidence } from '../src/lib/presentation/components/evidence-filter';

const mkImg = (name: string, thumb = false) => ({ path: name, url: 'http://example.com/'+name, mimeType: 'image/jpeg', name, size: 1, ...(thumb? { isThumbnail: true }: {}) });
const mkPdf = (name: string) => ({ path: name, url: 'http://example.com/'+name, mimeType: 'application/pdf', name, size: 1 });

describe('filterEvidence', () => {
  it('removes thumbnail if non-thumbnail image exists', () => {
    const input = [mkImg('a-thumb.jpg', true), mkImg('b.jpg'), mkImg('c.jpg')];
    const out = filterEvidence(input as any);
    expect(out.find(f=>f.isThumbnail)).toBeUndefined();
    expect(out.length).toBe(2);
  });
  it('keeps thumbnail if it is the only image', () => {
    const input = [mkImg('only-thumb.jpg', true)];
    const out = filterEvidence(input as any);
    expect(out.length).toBe(1);
    expect(out[0].isThumbnail).toBe(true);
  });
  it('does not remove non-image files even if thumbnail exists', () => {
    const input = [mkImg('a-thumb.jpg', true), mkPdf('doc.pdf')];
    const out = filterEvidence(input as any);
    expect(out.length).toBe(2);
    expect(out.some(f=>f.mimeType==='application/pdf')).toBe(true);
  });
});
