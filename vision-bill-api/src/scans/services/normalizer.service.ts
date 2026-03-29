import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

@Injectable()
export class NormalizerService {
  private readonly logger = new Logger(NormalizerService.name);
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.genAI = new GoogleGenerativeAI(apiKey || 'stub-key');
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  static scrubPII(text: string): string {
    if (!text) return '';
    return text
      // Mask Card Numbers (e.g., 4111-12XX-XXXX-1111)
      .replace(/\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g, '**** **** **** ****')
      // Mask expiry dates
      .replace(/\b\d{2}\/\d{2,4}\b/g, '**/**')
      // Mask possible phone numbers
      .replace(/\+?\d{2,3}[\s-]?\d{10}/g, '***-***-****')
      // Mask Email addresses
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '****@****.***');
  }

  async normalizeImage(imageBuffer: Buffer): Promise<any> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey || apiKey === 'mock-gemini-key') {
      return {
        merchantName: "Stub Bazaar",
        billType: 'grocery',
        items: [
          { shorthand: 'ORG_TMT_1KG', cleanName: 'Organic Tomatoes 1kg', qty: 1, price: 150.00, category: 'Veggies', unit: 'kg' },
          { shorthand: 'MILK_FT_1L', cleanName: 'Fresh Whole Milk 1L', qty: 1, price: 65.00, category: 'Dairy', unit: 'l' },
        ],
        total: 215.00,
        currency: 'INR'
      };
    }

    const imagePart = {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType: 'image/jpeg',
      },
    };

    const prompt = `
      You are a world-class retail data engineer. Analyze the attached receipt image and extract a structured, high-fidelity JSON object.
      
      Extraction Requirements:
      1. Store Identity: Identify the 'merchantName' (e.g., 'BigBasket', 'India Mart', 'DMart') and 'merchantAddress'.
      2. Item Normalization: Correct shorthand names to descriptive 'cleanName' (e.g., 'ORGTL_1KG' -> 'Organic Toor Dal 1kg').
      3. Global Categorization: Categorize each item (Veggies, Dairy, Snacks, Beverages, Household, Meat, Personal Care).
      4. Pricing Logic: 
         - Extract 'qty' (number), 'unit' (string like 'kg', 'l', 'pc') for each item.
         - IMPORTANT: Normalize all weights/volumes to a standard base unit (e.g. convert 500g to 0.5kg, or 500ml to 0.5L) in the 'unit' field.
         - The 'price' must be the FINAL amount paid for that quantity.
      5. Tax & GST: Extract 'cgst', 'sgst', and 'taxTotal'.
      6. Context Detection: Determine 'billType' ('grocery' or 'restaurant') and 'total'. 
      7. Grand Total: Final 'total' amount inclusive of taxes. Output strictly in INR.

      Return ONLY a pure JSON object:
      {
        "merchantName": string,
        "merchantAddress": string,
        "billType": "grocery" | "restaurant",
        "currency": "INR",
        "items": [
          { "shorthand": string, "cleanName": string, "qty": number, "price": number, "category": string, "unit": string }
        ],
        "cgst": number,
        "sgst": number,
        "taxTotal": number,
        "total": number,
        "rawText": string (the full OCR text for lookup)
      }
    `;

    try {
      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();
      const cleanJson = text.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      this.logger.error('Multimodal Gemini failed', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }
}

