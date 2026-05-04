import { storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const MAX_DIMENSION = 800;
const JPEG_QUALITY = 0.75;

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width >= height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        blob => {
          if (blob) resolve(blob);
          else reject(new Error('Falha ao comprimir imagem'));
        },
        'image/jpeg',
        JPEG_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Falha ao carregar imagem'));
    };

    img.src = objectUrl;
  });
}

export async function uploadCharacterImage(file: File, themeId: string): Promise<string> {
  const compressed = await compressImage(file);
  const path = `characters/${themeId}/${Date.now()}.jpg`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, compressed, { contentType: 'image/jpeg' });
  return getDownloadURL(storageRef);
}

// Faz upload de um blob já cortado/comprimido pelo CropEditor
export async function uploadCroppedImage(blob: Blob, themeId: string): Promise<string> {
  const path = `characters/${themeId}/${Date.now()}.jpg`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
  return getDownloadURL(storageRef);
}

export async function uploadThemeCover(file: File, themeId: string): Promise<string> {
  const compressed = await compressImage(file);
  const path = `themes/${themeId}/cover_${Date.now()}.jpg`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, compressed, { contentType: 'image/jpeg' });
  return getDownloadURL(storageRef);
}

// Upload de capa de tema já recortada pelo CropEditor
export async function uploadCroppedThemeCover(blob: Blob, themeId: string): Promise<string> {
  const path = `themes/${themeId}/cover_${Date.now()}.jpg`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
  return getDownloadURL(storageRef);
}
