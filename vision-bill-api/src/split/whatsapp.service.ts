import { Injectable } from '@nestjs/common';

@Injectable()
export class WhatsappService {
  /**
   * Generates a WhatsApp deep link for a given participant share.
   * @param participant The participant's share information.
   * @param items Optional list of items assigned to the participant.
   * @returns A URL string for WhatsApp messaging.
   */
  generateDeepLink(participant: { participantName: string; amount: number; mobile?: string }, items: any[] = []) {
    const amountStr = participant.amount.toFixed(2);
    let message = `Hi ${participant.participantName}, you owe Rs.${amountStr} for the bill.`;

    if (items && items.length > 0) {
      const itemsList = items.map(i => i.cleanName || i.name).join(', ');
      message += ` (Items: ${itemsList})`;
    }

    const encodedMessage = encodeURIComponent(message);
    const phoneNumber = participant.mobile ? participant.mobile.replace(/\D/g, '') : '';
    
    // Fallback if no mobile number is provided
    if (!phoneNumber) {
       return `https://wa.me/?text=${encodedMessage}`;
    }

    return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
  }
}
