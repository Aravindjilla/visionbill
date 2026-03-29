import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class StitchingService {
  async stitchImages(imagePaths: string[]): Promise<string> {
    if (imagePaths.length === 0) return 'placeholder-url';
    if (imagePaths.length === 1) return imagePaths[0];

    const images = await Promise.all(
      imagePaths.map(async (p) => {
        const metadata = await sharp(p).metadata();
        return { path: p, width: metadata.width || 0, height: metadata.height || 0 };
      }),
    );

    const maxWidth = Math.max(...images.map((img) => img.width));
    const totalHeight = images.reduce((acc, img) => acc + img.height, 0);

    // Performance Audit Guard: Prevent OOM on massive image clusters
    const MAX_PIXELS = 100 * 1000 * 1000; // 100 Megapixels limit
    if (maxWidth * totalHeight > MAX_PIXELS) {
      throw new Error(`Stitching exceeded safety limit of 100MP (${(maxWidth * totalHeight / 1000000).toFixed(1)}MP). Please split into fewer segments.`);
    }

    const outputFileName = `stitched-${Date.now()}.jpg`;
    const outputPath = path.join(path.dirname(imagePaths[0]), outputFileName);

    let currentY = 0;
    const compositeInput = images.map((img) => {
      const input = { input: img.path, top: currentY, left: 0 };
      currentY += img.height;
      return input;
    });

    try {
      await sharp({
        create: {
          width: maxWidth,
          height: totalHeight,
          channels: 3,
          background: { r: 255, g: 255, b: 255 },
        },
      })
        .composite(compositeInput)
        .jpeg({ quality: 80, mozjpeg: true })
        .toFile(outputPath);

      // Successfully stitched, now cleanup segments
      await this.cleanupSegments(imagePaths);
      
      return outputPath;
    } catch (err) {
      console.error('Stitching failed', err);
      throw err;
    }
  }

  private async cleanupSegments(paths: string[]): Promise<void> {
    for (const p of paths) {
      try {
        await fs.unlink(p);
      } catch (e) {
        console.warn(`Failed to delete segment file ${p}: ${e.message}`);
      }
    }
  }
}


