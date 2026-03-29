import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job, Queue } from 'bullmq';
import { PantryItem, PantryItemDocument } from './schemas/pantry-item.schema';
import { UserService } from '../auth/user.service';
import { NotificationService } from '../auth/notification.service';

const SHELF_LIFE_DAYS: Record<string, number> = {
  Dairy: 3,
  Veggies: 5,
  Meat: 2,
  Beverages: 30,
  Snacks: 30,
  Household: 180,
  'Personal Care': 365,
};
const DEFAULT_SHELF_LIFE = 7;
const ALERT_DAYS_BEFORE = 2;

@Processor('expiry-queue')
export class ExpiryProcessor extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(ExpiryProcessor.name);

  constructor(
    @InjectQueue('expiry-queue') private expiryQueue: Queue,
    @InjectModel(PantryItem.name) private pantryModel: Model<PantryItemDocument>,
    private userService: UserService,
    private notificationService: NotificationService,
  ) {
    super();
  }

  async onModuleInit() {
    // Remove stale repeatable job before re-adding to avoid duplicates on restart
    await this.expiryQueue.removeRepeatable('check-expiry', { pattern: '0 9 * * *' }).catch(() => {});
    await this.expiryQueue.add(
      'check-expiry',
      {},
      {
        repeat: { pattern: '0 9 * * *' }, // every day at 9 AM
        jobId: 'daily-expiry-check',
      }
    );
    this.logger.log('Expiry check job scheduled (daily at 9 AM)');
  }

  async process(job: Job): Promise<void> {
    this.logger.log('Running daily expiry check...');
    const now = new Date();

    const allItems = await this.pantryModel.find().exec();

    // Group items by userId
    const byUser: Record<string, PantryItemDocument[]> = {};
    for (const item of allItems) {
      const uid = item.userId.toString();
      if (!byUser[uid]) byUser[uid] = [];
      byUser[uid].push(item);
    }

    for (const [userId, items] of Object.entries(byUser)) {
      const expiring: string[] = [];

      for (const item of items) {
        const shelfDays = SHELF_LIFE_DAYS[item.category] ?? DEFAULT_SHELF_LIFE;
        const updatedAt = new Date((item as any).updatedAt);
        const expiresAt = new Date(updatedAt);
        expiresAt.setDate(expiresAt.getDate() + shelfDays);

        const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 3600 * 24));
        if (daysLeft >= 0 && daysLeft <= ALERT_DAYS_BEFORE) {
          const label = daysLeft === 0 ? 'expires today' : `${daysLeft}d left`;
          expiring.push(`${item.cleanName} (${label})`);
        }
      }

      if (expiring.length === 0) continue;

      try {
        const user = await this.userService.findById(userId);
        if (user?.pushToken) {
          const preview = expiring.slice(0, 3).join(', ');
          const suffix = expiring.length > 3 ? ` +${expiring.length - 3} more` : '';
          await this.notificationService.sendNotification(
            user.pushToken,
            '⚠️ Items Expiring Soon',
            preview + suffix,
            { type: 'expiry', items: expiring },
          );
        }
      } catch {
        // User not found or no push token — skip silently
      }
    }

    this.logger.log(`Expiry check done. Checked ${allItems.length} items across ${Object.keys(byUser).length} users.`);
  }
}
