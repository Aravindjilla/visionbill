import { IBillStrategy } from './bill-strategy.interface';
import { BillItem } from '../schemas/bill-item.schema';

export class RestaurantStrategy implements IBillStrategy {
  normalize(rawItems: any[]): BillItem[] {
    return rawItems.map(item => ({
      shorthand: item.description,
      cleanName: item.description,
      category: 'Food & Beverage',
      qty: item.qty || 1,
      unit: 'serv',
      price: item.price || 0,
      imageUrl: item.imageUrl,
      assignedParticipants: [],
      isSplit: false,
    }));
  }
}
