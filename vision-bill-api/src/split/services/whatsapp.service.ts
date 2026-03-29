import { Injectable } from '@nestjs/common';

@Injectable()
export class WhatsappService {
  generateDeepLink(participant: { name: string; mobile: string; amount: number }, items: any[]): string {
    const message = encodeURIComponent(
      `Hi ${participant.name}, here is your split for VisionBill:\n\n` +
      `Amount: ₹${participant.amount.toFixed(2)}\n\n` +
      `Items:\n${items.map(i => `- ${i.cleanName} (₹${i.price})`).join('\n')}\n\n` +
      `Pay here: upi://pay?pa=your-upi-id@bank&pn=VisionBill&am=${participant.amount.toFixed(2)}`
    );
    return `https://wa.me/${participant.mobile}?text=${message}`;
  }
}
