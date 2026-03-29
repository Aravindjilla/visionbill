import { BillItem } from '../schemas/bill-item.schema';

export interface IBillStrategy {
  normalize(rawItems: any[]): BillItem[];
}
