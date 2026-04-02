import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CACHE_TTL, NOTIFICATION_STRINGS, SHELF_LIFE_CONFIG, EXPIRY_CRON } from '../common/constants';
import { Job, Queue } from 'bullmq';
import { PantryItem, PantryItemDocument } from './schemas/pantry-item.schema';
import { UserService } from '../auth/user.service';
import { NotificationService } from '../auth/notification.service';



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
    await this.expiryQueue.removeRepeatable(EXPIRY_CRON.JOB_ID, { pattern: EXPIRY_CRON.PATTERN }).catch(() => {});
    await this.expiryQueue.add(
      EXPIRY_CRON.JOB_ID,
      {},
      {
        repeat: { pattern: EXPIRY_CRON.PATTERN }, // daily at configured time
        jobId: EXPIRY_CRON.JOB_ID,
      }
    );
    this.logger.log(`Expiry check job scheduled (pattern: ${EXPIRY_CRON.PATTERN})`);
  }

  async process(job: Job): Promise<void> {
    this.logger.log('Running daily expiry check...');
    const now = new Date();

    // Only load items updated within the maximum possible shelf life window.
    // Items older than 365 days (Personal Care max) cannot possibly be in the alert window.
    const cutoff = new Date(now);
    const maxShelfLife = Math.max(...Object.values(SHELF_LIFE_CONFIG.DAYS_BY_CATEGORY));
    cutoff.setDate(cutoff.getDate() - (maxShelfLife + SHELF_LIFE_CONFIG.ALERT_DAYS_BEFORE));

    const allItems = await this.pantryModel
      .find({ updatedAt: { $gte: cutoff } })
      .select('userId cleanName category updatedAt')
      .exec();

    // Group items by userId and compute expiring labels
    const byUser: Record<string, string[]> = {};
    for (const item of allItems) {
      const shelfDays = SHELF_LIFE_CONFIG.DAYS_BY_CATEGORY[item.category] ?? SHELF_LIFE_CONFIG.DEFAULT_SHELF_LIFE;
      const updatedAt = new Date((item as any).updatedAt);
      const expiresAt = new Date(updatedAt);
      expiresAt.setDate(expiresAt.getDate() + shelfDays);

      const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 3600 * 24));
      if (daysLeft >= 0 && daysLeft <= SHELF_LIFE_CONFIG.ALERT_DAYS_BEFORE) {
        const uid = item.userId.toString();
        const label = daysLeft === 0 ? 'expires today' : `${daysLeft}d left`;
        if (!byUser[uid]) byUser[uid] = [];
        byUser[uid].push(`${item.cleanName} (${label})`);
      }
    }

    const usersWithExpiry = Object.keys(byUser);
    if (usersWithExpiry.length === 0) {
      this.logger.log('Expiry check done. No expiring items found.');
      return;
    }

    // Batch fetch all users with push tokens in a single query (eliminates N+1)
    const users = await this.userService.findManyWithPushTokens(usersWithExpiry);
    const userMap = new Map(users.map(u => [u._id.toString(), u]));

    for (const [userId, expiring] of Object.entries(byUser)) {
      const user = userMap.get(userId);
      if (!user?.pushToken) continue;

      try {
        const preview = expiring.slice(0, 3).join(', ');
        const suffix = expiring.length > 3 ? ` +${expiring.length - 3} more` : '';
        await this.notificationService.sendNotification(
          user.pushToken,
          NOTIFICATION_STRINGS.ITEMS_EXPIRING,
          preview + suffix,
          { type: 'expiry', items: expiring },
        );
      } catch {
        // Non-blocking — skip silently
      }
    }

    this.logger.log(`Expiry check done. Checked ${allItems.length} items, notified ${usersWithExpiry.length} users.`);
  }
}
