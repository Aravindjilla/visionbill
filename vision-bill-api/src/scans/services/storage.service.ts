import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs/promises';
import { STORAGE_CONFIG } from '../../common/constants';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(private configService: ConfigService) {
    const cloudinaryUrl = this.configService.get<string>('CLOUDINARY_URL');
    if (cloudinaryUrl && !cloudinaryUrl.includes('mock')) {
      cloudinary.config({
        cloudinary_url: cloudinaryUrl,
      });
    } else {
      this.logger.warn('Cloudinary not configured or in mock mode. File uploads will return local paths.');
    }
  }

  async uploadImage(filePath: string): Promise<string> {
    const isMock = this.configService.get<string>('CLOUDINARY_URL')?.includes('mock');
    
    if (isMock) {
      this.logger.log(`Mock upload for ${filePath}`);
      return filePath;
    }

    const MAX_RETRIES = 3;
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
      try {
        attempt++;
        const result = await cloudinary.uploader.upload(filePath, {
          folder: STORAGE_CONFIG.RECEIPTS_FOLDER,
          resource_type: 'image',
        });
        
        await fs.unlink(filePath);
        return result.secure_url;
      } catch (error) {
        this.logger.warn(`Cloudinary upload attempt ${attempt} failed: ${error.message}`);
        if (attempt >= MAX_RETRIES) {
          this.logger.error(`Cloudinary upload failed after ${MAX_RETRIES} attempts. Keeping local file for failover.`);
          return filePath;
        }
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    return filePath;
  }
}
