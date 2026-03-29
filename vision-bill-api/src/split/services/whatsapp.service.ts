import { Injectable } from '@nestjs/common';

@Injectable()
export class WhatsappService {
  generateDeepLink(
    participant: { name: string; mobile: string; amount: number }, 
    items: any[],
    payeeVpa: string = 'aravind@upi' // Fallback for demo
  ): string {
    const itemLines = items.map(i => `• ${i.cleanName}: ₹${i.price}`).join('\n');
    const upiLink = `upi://pay?pa=${payeeVpa}&pn=VisionBill&am=${participant.amount.toFixed(2)}&cu=INR&tn=Split%20via%20VisionBill`;
    
    const message = encodeURIComponent(
      `💸 *VisionBill Split Request*\n\n` +
      `Hey ${participant.name}! Here's your share:\n` +
      `💰 *Amount: ₹${participant.amount.toFixed(2)}*\n\n` +
      `${items.length > 0 ? `📦 *Items:*\n${itemLines}\n\n` : ''}` +
      `⚡ *Pay instantly:* ${upiLink}\n\n` +
      `Generated via VisionBill 🚀`
    );
    
    return `whatsapp://send?phone=${participant.mobile}&text=${message}`;
  }
}
