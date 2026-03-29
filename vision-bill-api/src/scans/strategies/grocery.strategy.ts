import { IBillStrategy } from './bill-strategy.interface';
import { BillItem } from '../schemas/bill-item.schema';

export class GroceryStrategy implements IBillStrategy {
  normalize(rawItems: any[]): BillItem[] {
    return rawItems.map(item => ({
      shorthand: item.shorthand || item.description,
      cleanName: this.expandShorthand(item.shorthand || item.description),
      category: item.category || 'General',
      qty: item.qty || 1,
      unit: item.unit || 'pcs',
      price: item.price || 0,
      imageUrl: item.imageUrl,
    }));
  }

  private expandShorthand(shorthand: string): string {
    if (!shorthand) return 'Unknown Item';
    // Simplified mapping for Phase 1
    const mapping: Record<string, string> = {
      'ORG_TMT_1KG': 'Organic Tomato 1kg',
      'MILK_FT_1L': 'Full Cream Milk 1L',
      'BRD_WHT_400G': 'White Bread 400g',
    };
    return mapping[shorthand] || shorthand;
  }
}
