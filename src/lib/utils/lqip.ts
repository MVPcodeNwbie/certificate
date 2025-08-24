// Generate a tiny blurred base64 JPEG placeholder from an image File or URL.
export async function generateBlurDataUrl(file: File, maxSize = 12): Promise<string | undefined> {
  if (!file.type.startsWith('image/')) return undefined;
  try {
    const img = await loadImage(file);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    const targetW = 20; // very small
    const ratio = img.height / img.width;
    canvas.width = targetW;
    canvas.height = Math.round(targetW * ratio);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    // Simple blur by scaling down then up (already small) or apply CSS filter later
    return canvas.toDataURL('image/jpeg', 0.5);
  } catch {
    return undefined;
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject)=>{
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = reject;
    img.src = url;
  });
}