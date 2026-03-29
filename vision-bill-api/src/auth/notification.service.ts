import { Injectable, Logger } from '@nestjs/common';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

@Injectable()
export class NotificationService {
  private expo = new Expo();
  private readonly logger = new Logger(NotificationService.name);

  async sendNotification(pushToken: string, title: string, body: string, data?: any) {
    if (!Expo.isExpoPushToken(pushToken)) {
      this.logger.error(`Push token ${pushToken} is not a valid Expo push token`);
      return;
    }

    const messages: ExpoPushMessage[] = [{
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
    }];

    try {
      const tickets = await this.expo.sendPushNotificationsAsync(messages);
      this.logger.log(`Notification sent to ${pushToken}: ${JSON.stringify(tickets)}`);
    } catch (error) {
      this.logger.error('Error sending push notification', error);
    }
  }
}
