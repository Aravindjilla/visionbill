import { NormalizerService } from '../src/scans/services/normalizer.service';

describe('NormalizerService.scrubPII', () => {
  it('should mask credit card numbers', () => {
    const input = 'My card is 4111-2222-3333-4444 and also 1234123412341234';
    const output = NormalizerService.scrubPII(input);
    expect(output).toBe('My card is **** **** **** **** and also **** **** **** ****');
  });

  it('should mask expiry dates', () => {
    const input = 'Expires on 12/24 and 01/2026';
    const output = NormalizerService.scrubPII(input);
    expect(output).toBe('Expires on **/** and **/**');
  });

  it('should mask phone numbers', () => {
    const input = 'Call +91 9876543210 or 080-1234567890';
    const output = NormalizerService.scrubPII(input);
    // Our regex: /\+?\d{2,3}[\s-]?\d{10}/g
    expect(output).toBe('Call ***-***-**** or ***-***-****');
  });

  it('should mask email addresses', () => {
    const input = 'Contact me at john.doe@example.com or support@visionbill.in';
    const output = NormalizerService.scrubPII(input);
    expect(output).toBe('Contact me at ****@****.*** or ****@****.***');
  });

  it('should handle empty or null text', () => {
    expect(NormalizerService.scrubPII('')).toBe('');
    expect(NormalizerService.scrubPII(null as any)).toBe('');
  });
});
