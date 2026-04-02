import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs/promises';
import { NormalizerService } from './normalizer.service';
import { GEMINI_CONFIG } from '../../common/constants';

@Injectable()
export class OcrService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private readonly logger = new Logger(OcrService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.genAI = new GoogleGenerativeAI(apiKey || GEMINI_CONFIG.STUB_KEY_FALLBACK);
    this.model = this.genAI.getGenerativeModel({ model: GEMINI_CONFIG.MODEL_NAME });
  }

  async processImage(imageUrl: string): Promise<string> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    
    if (!apiKey || apiKey === GEMINI_CONFIG.MOCK_KEY_CHECK) {
      this.logger.warn('[OCR] Using stubbed response as Gemini key is mock.');
      return 'RAW RECEIPT TEXT STUB:\nORG_TMT_1KG 150.00\nMILK_FT_1L 65.00\nTOTAL 215.00';
    }

    try {
      this.logger.log(`[OCR] Real processing for: ${imageUrl}`);
      
      // Load image data
      const imageData = await fs.readFile(imageUrl);
      const imagePart = {
        inlineData: {
          data: imageData.toString('base64'),
          mimeType: 'image/jpeg',
        },
      };

      const prompt = "Extract every single line of text from this retail receipt accurately. Maintain the structure, shorthand, prices, and alignment as much as possible.";
      
      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      return NormalizerService.scrubPII(response.text());
    } catch (error) {
      this.logger.error('[OCR] Gemini OCR processing failed:', error.message);
      throw error;
    }
  }
}
