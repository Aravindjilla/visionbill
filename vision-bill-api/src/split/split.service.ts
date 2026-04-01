import { Injectable } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';

@Injectable()
export class SplitService {
  constructor(private whatsappService: WhatsappService) {}

  calculateEqualSplit(total: number, participants: any[]) {
    const amountPerPerson = Math.round((total / participants.length) * 100) / 100;
    
    return participants.map(p => ({
      ...p,
      amount: amountPerPerson,
      whatsappLink: this.whatsappService.generateDeepLink({ ...p, amount: amountPerPerson }, []),
    }));
  }

  calculateItemizedSplit(items: any[], participants: any[]) {
    const participantShares = participants.map(p => {
      const pItems = items.filter(i => 
        i.assignedParticipants && i.assignedParticipants.some((ap: { participantId: string; share: number }) => ap.participantId === p.id)
      );

      const totalAmount = pItems.reduce((acc, item) => {
        const pShare = item.assignedParticipants.find((ap: { participantId: string; share: number }) => ap.participantId === p.id).share;
        return acc + (item.price * pShare);
      }, 0);

      const roundedAmount = Math.round(totalAmount * 100) / 100;

      return {
        ...p,
        amount: roundedAmount,
        items: pItems.map(i => ({ cleanName: i.cleanName, price: i.price })),
        whatsappLink: this.whatsappService.generateDeepLink({ ...p, amount: roundedAmount }, pItems),
      };
    });

    return participantShares;
  }
}
