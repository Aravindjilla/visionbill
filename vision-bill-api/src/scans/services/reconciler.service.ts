import { Injectable } from '@nestjs/common';

@Injectable()
export class ReconcilerService {
  reconcile(items: any[], extraxtedTotal: number): boolean {
    const sum = items.reduce((acc, item) => acc + (item.price * (item.qty || 1)), 0);
    // Allow for small rounding differences
    return Math.abs(sum - extraxtedTotal) < 0.01;
  }
}
