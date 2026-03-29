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
      You are a world-class retail data engineer. Analyze the following OCR raw text from a captured receipt and extract a structured, high-fidelity JSON object.
      Raw Text:
      "${cleanText}"

      Extraction Requirements:
      1. Store Identity: Identify the 'storeName' (e.g., 'BigBasket', 'StarBazaar', 'Social Offline').
      2. Item Normalization: Correct shorthand names to descriptive 'cleanName' (e.g., 'ORGTL_1KG' -> 'Organic Toor Dal 1kg').
      3. Global Categorization: Categorize each item (Veggies, Dairy, Snacks, Beverages, Household, Meat, Personal Care).
      4. Pricing Logic: 
         - Extract 'qty' (number), 'unit' (string like 'kg', 'l', 'pc'), and final 'price' (number) for each item.
         - The 'price' must be the FINAL amount paid for that quantity after all item-specific discounts.
      5. Tax & Surcharges: Detect and extract 'CGST', 'SGST', 'VAT', or 'Service Charge' as separate items in the list.
      6. Context Detection: Determine 'billType' ('grocery' or 'restaurant') and 'currency' (e.g., 'INR', 'USD').
      7. Grand Total: Extract the absolute 'total' amount from the final payment line.

      Return ONLY a pure JSON object with the following structure:
      {
        "storeName": string,
        "billType": "grocery" | "restaurant",
        "currency": string,
        "items": [
          { "shorthand": string, "cleanName": string, "qty": number, "price": number, "category": string, "unit": string }
        ],
        "total": number
      }

      Important: Do not include any markdown formatting, backticks, or explanatory text. Return the JSON object directly.
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

