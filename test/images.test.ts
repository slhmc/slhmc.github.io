import { test } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { imageManifest } from '../src/image-manifest.ts';
import { screens, imagePath } from '../src/screens.ts';

test('Optimized screens preserve full-size pixels and provide correctly proportioned mobile images', async () => {
  for (const language of ['RU', 'EN'] as const) {
    for (const screen of screens) {
      const variants = imageManifest[`${language}/${screen}`];
      assert.ok(variants, `${language}/${screen}`);
      const original = new URL(`../public${imagePath(screen, language)}`, import.meta.url);
      const full = new URL(`../public${variants.full}`, import.meta.url);
      const mobile = new URL(`../public${variants.mobile}`, import.meta.url);
      const metadata = await sharp(fileURLToPath(mobile)).metadata();
      assert.deepEqual([metadata.width, metadata.height], [1024, 542]);
      const sourcePixels = await sharp(fileURLToPath(original)).ensureAlpha().raw().toBuffer();
      const optimizedPixels = await sharp(fileURLToPath(full)).ensureAlpha().raw().toBuffer();
      assert.ok(sourcePixels.equals(optimizedPixels), `${language}/${screen}: full-size conversion must be lossless`);
    }
  }
});
