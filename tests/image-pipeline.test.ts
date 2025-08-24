import { describe, it, expect, beforeEach } from 'vitest';
import { generateBlurDataUrl } from '../src/lib/utils/lqip';

// Mock Image & canvas for jsdom
class MockImage {
  width = 100; height = 50; onload: any; onerror: any; src = '';
  constructor(){ setTimeout(()=> this.onload && this.onload({}), 0); }
}
(global as any).Image = MockImage as any;

beforeEach(() => {
  (global as any).URL.createObjectURL = () => 'blob:mock';
  (global as any).URL.revokeObjectURL = () => {};
  (global as any).document.createElement = (tag: string) => {
    if (tag === 'canvas') {
      return {
        width:0,height:0,
        getContext: () => ({ drawImage: ()=>{} }),
        toDataURL: () => 'data:image/jpeg;base64,xxx'
      } as any;
    }
    return { } as any;
  };
});

describe('Image pipeline blur fallback', () => {
  it('returns undefined for non-image file', async () => {
    const file = new File([new Uint8Array([1,2,3])], 'test.pdf', { type:'application/pdf' });
    const res = await generateBlurDataUrl(file as any);
    expect(res).toBeUndefined();
  });
  it('returns data url for image file', async () => {
    const file = new File([new Uint8Array([1,2,3])], 'test.jpg', { type:'image/jpeg' });
    const res = await generateBlurDataUrl(file as any);
    expect(typeof res).toBe('string');
    expect(res).toMatch(/^data:image\/jpeg/);
  });
});
