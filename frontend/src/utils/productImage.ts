import { getBackendOrigin } from '../config/api';

/** Turns a stored image path/URL into something an <img> can load. */
export function resolveProductImage(path?: string | null): string | null {
  if (!path) return null;
  return path.startsWith('http://') || path.startsWith('https://') ? path : `${getBackendOrigin()}${path}`;
}

/** Reads an image file and downscales it (max 1000px) to a JPEG data URL, keeping uploads small. */
export function fileToResizedDataUrl(file: File, maxDim = 1000): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) { reject(new Error('Please choose an image file.')); return; }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not read that image.'));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Could not process the image.')); return; }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
