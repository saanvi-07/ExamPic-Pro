
import { SizeRequirement, DimensionRequirement, ImageTransform } from '../types';

export const processImage = async (
  file: File,
  reqDims: DimensionRequirement,
  reqSize: SizeRequirement,
  transform?: ImageTransform
): Promise<{ blob: Blob; width: number; height: number; sizeKB: number }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('Could not get canvas context');

        canvas.width = reqDims.width;
        canvas.height = reqDims.height;

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Apply filters
        if (transform) {
          ctx.filter = `brightness(${transform.brightness}%) contrast(${transform.contrast}%)`;
        }

        ctx.save();
        
        if (transform) {
          // Combined rotation: Snap rotation + Fine-grained rotation
          const totalRotate = transform.rotate + transform.fineRotate;
          
          // Move to center of canvas for rotation and scale
          ctx.translate(canvas.width / 2 + transform.x, canvas.height / 2 + transform.y);
          ctx.rotate((totalRotate * Math.PI) / 180);
          ctx.scale(transform.scale, transform.scale);
          
          // Draw image centered at the translated origin
          ctx.drawImage(img, -img.width / 2, -img.height / 2);
        } else {
          // Default: Fit image
          const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
          const x = (canvas.width - img.width * scale) / 2;
          const y = (canvas.height - img.height * scale) / 2;
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        }
        
        ctx.restore();
        ctx.filter = 'none'; // Reset filter

        // Compression loop
        let quality = 0.95;
        let blob: Blob | null = null;
        let sizeKB = 0;

        while (quality > 0.05) {
          blob = await new Promise((res) => canvas.toBlob((b) => res(b), 'image/jpeg', quality));
          if (!blob) break;
          sizeKB = blob.size / 1024;
          
          if (sizeKB <= reqSize.maxKB) {
            if (sizeKB >= reqSize.minKB || quality <= 0.1) {
              break;
            } else {
              if (quality >= 0.95) break;
              quality += 0.05;
              if (quality > 1) { quality = 1; break; }
            }
          } else {
            quality -= 0.05;
          }
        }

        if (!blob) return reject('Failed to generate blob');

        resolve({
          blob,
          width: canvas.width,
          height: canvas.height,
          sizeKB
        });
      };
      img.onerror = () => reject('Failed to load image');
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject('Failed to read file');
    reader.readAsDataURL(file);
  });
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      resolve(base64.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });
};
