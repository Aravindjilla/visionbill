import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class NormalizerService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.genAI = new GoogleGenerativeAI(apiKey || 'stub-key');
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  private scrubPII(text: string): string {
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

  async normalizeText(rawText: string): Promise<any> {
    const cleanText = this.scrubPII(rawText);
    
    if (!this.configService.get<string>('GEMINI_API_KEY') || this.configService.get<string>('GEMINI_API_KEY') === 'mock-gemini-key') {
      // Return stub for development
      return {
        billType: 'grocery',
        items: [
          { shorthand: 'ORG_TMT_1KG', qty: 1, price: 150.00, category: 'Veggies' },
          { shorthand: 'MILK_FT_1L', qty: 1, price: 65.00, category: 'Dairy' },
        ],
        total: 215.00,
      };
    }

    const prompt = `
      You are a retail receipt expert. Analyze the following OCR raw text and extract an itemized list in JSON format.
      Raw Text:
      "${cleanText}"

      Requirements:
      1. Correct shorthand names to descriptive clean names (e.g., ORG_TMT_1KG -> Organic Tomato 1kg).
      2. Categorize each item accurately (e.g., Dairy, Veggies, Snacks, Beverages, Household).
      3. Extract quantity (qty), unit price (price), and unit. Price should be the final price per unit AFTER any item-specific discounts.
      4. Detect and extract 'Tax', 'Service Charges', or 'VAT' as separate items in the list if they are explicitly mentioned.
      5. Detect the 'billType' (either 'grocery' or 'restaurant').
      6. Extract the 'total' amount from the final payment line.
      7. Handle multi-buy discounts by adjusting the unit price accordingly.

      Return ONLY a JSON object with this structure:
      {
        "billType": "grocery" | "restaurant",
        "items": [
          { "shorthand": string,"qty": number, "price": number, "category": string, "unit": string }
        ],
        "total": number
      }
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      // Clean possible markdown backticks
      const cleanJson = text.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      console.error('Gemini Normalization failed:', error);
      throw error;
    }
  }
}

