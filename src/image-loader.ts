import type { Language } from './i18n.ts';
import { type Screen } from './screens.ts';
import { imageManifest } from './image-manifest.ts';

export type ImageSize = 'full' | 'mobile';
export function previewPath(screen: Screen, language: Language, size: ImageSize = 'full') {
  return imageManifest[`${language}/${screen}`][size];
}

const images = new Map<string, Promise<HTMLImageElement>>();
export function loadScreen(screen: Screen, language: Language, size: ImageSize = 'full', priority: 'high' | 'low' = 'high'): Promise<HTMLImageElement> {
  const path = previewPath(screen, language, size);
  const cached = images.get(path);
  if (cached) return cached;
  const request = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.fetchPriority = priority;
    const timer = window.setTimeout(fail, 12000);
    function fail() {
      window.clearTimeout(timer);
      images.delete(path);
      img.onload = img.onerror = null;
      reject(new Error(`Image unavailable: ${path}`));
    }
    img.onload = () => { window.clearTimeout(timer); resolve(img); };
    img.onerror = fail;
    img.src = path;
  });
  images.set(path, request);
  return request;
}
