// Global test setup (runs before each test suite)
// Provide minimal canvas & Image stubs if not already defined in specific tests.

if (!(global as any).Image) {
  class StubImage {
    width = 50; height = 50; onload: any; onerror: any; src = '';
    constructor(){ setTimeout(()=> this.onload && this.onload({}), 0); }
  }
  ;(global as any).Image = StubImage as any;
}

if (!(global as any).HTMLCanvasElement || !(global as any).HTMLCanvasElement.prototype.getContext) {
  (global as any).HTMLCanvasElement = function(){} as any;
  (global as any).HTMLCanvasElement.prototype.getContext = function() { return { drawImage() {}, }; };
}

// Silence console noise from Firebase emulator tests (optional)
const origError = console.error;
console.error = (...args: any[]) => {
  if (typeof args[0] === 'string' && args[0].includes('Firestore (')) return; // skip verbose SDK warnings
  origError(...args);
};
