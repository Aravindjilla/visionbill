import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs/promises';

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
      return filePath; // In mock mode, we just return the local path
    }

    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'vision-bill/receipts',
        resource_type: 'image',
      });
      
      // Cleanup local file after upload
      await fs.unlink(filePath);
      
      return result.secure_url;
    } catch (error) {
      this.logger.error(`Cloudinary upload failed: ${error.message}`);
      // Fallback to local path if upload fails to keep the app working
      return filePath;
    }
  }
}
