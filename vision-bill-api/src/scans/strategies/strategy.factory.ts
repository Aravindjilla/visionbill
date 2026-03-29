import { Injectable } from '@nestjs/common';
import { BillType } from '../schemas/scan.schema';
import { IBillStrategy } from './bill-strategy.interface';
import { GroceryStrategy } from './grocery.strategy';
import { RestaurantStrategy } from './restaurant.strategy';

@Injectable()
export class StrategyFactory {
  private strategies: Map<BillType, IBillStrategy> = new Map();

  constructor() {
    this.strategies.set(BillType.GROCERY, new GroceryStrategy());
    this.strategies.set(BillType.RESTAURANT, new RestaurantStrategy());
  }

  getStrategy(type: BillType): IBillStrategy {
    const strategy = this.strategies.get(type);
    if (!strategy) {
      throw new Error(`Strategy not found for type: ${type}`);
    }
    return strategy;
  }
}
