import { NormalizerService } from './normalizer.service';

describe('NormalizerService.scrubPII', () => {
  const scrub = NormalizerService.scrubPII;

  // ── Null / empty guards ────────────────────────────────────────────────────
  it('returns empty string for empty input', () => {
    expect(scrub('')).toBe('');
  });

  it('returns empty string for falsy input', () => {
    expect(scrub(null as any)).toBe('');
    expect(scrub(undefined as any)).toBe('');
  });

  // ── Credit card numbers ────────────────────────────────────────────────────
  it('masks a 16-digit card number with spaces', () => {
    const result = scrub('Card: 4111 1111 1111 1111 Total: 500');
    expect(result).toContain('**** **** **** ****');
    expect(result).not.toContain('4111 1111 1111 1111');
  });

  it('masks a 16-digit card number with dashes', () => {
    const result = scrub('Card: 5500-0000-0000-0004');
    expect(result).toContain('**** **** **** ****');
    expect(result).not.toContain('5500-0000-0000-0004');
  });

  it('masks a 16-digit card number with no separators', () => {
    const result = scrub('4111111111111111');
    expect(result).toContain('**** **** **** ****');
    expect(result).not.toContain('4111111111111111');
  });

  // ── Expiry dates ───────────────────────────────────────────────────────────
  it('masks MM/YY expiry dates', () => {
    const result = scrub('Exp: 12/26');
    expect(result).toContain('**/**');
    expect(result).not.toContain('12/26');
  });

  it('masks MM/YYYY expiry dates', () => {
    const result = scrub('Expiry 03/2028');
    expect(result).toContain('**/**');
    expect(result).not.toContain('03/2028');
  });

  // ── Phone numbers ──────────────────────────────────────────────────────────
  it('masks Indian mobile numbers with country code', () => {
    const result = scrub('Call us: +91 9876543210');
    expect(result).toContain('***-***-****');
    expect(result).not.toContain('9876543210');
  });

  it('masks numbers with 3-digit country code', () => {
    const result = scrub('Phone: +971 5012345678');
    expect(result).toContain('***-***-****');
    expect(result).not.toContain('5012345678');
  });

  it('does not mask single-digit country code numbers (out of regex scope)', () => {
    // Regex requires 2-3 digit country code; +1 USA numbers are not in scope for Indian receipts
    const result = scrub('Phone: +1 8005551234');
    expect(result).toContain('+1 8005551234');
  });

  // ── Email addresses ────────────────────────────────────────────────────────
  it('masks email addresses', () => {
    const result = scrub('Contact: user@example.com for support');
    expect(result).toContain('****@****.***');
    expect(result).not.toContain('user@example.com');
  });

  it('masks emails with subdomains', () => {
    const result = scrub('Email: john.doe+tag@mail.company.co.in');
    expect(result).toContain('****@****.***');
    expect(result).not.toContain('john.doe+tag@mail.company.co.in');
  });

  // ── Non-PII content preserved ──────────────────────────────────────────────
  it('does not alter regular grocery receipt text', () => {
    const text = 'BigBasket\nOrganic Tomatoes 1kg x2 ₹150\nTotal: ₹300';
    const result = scrub(text);
    expect(result).toContain('BigBasket');
    expect(result).toContain('Organic Tomatoes');
    expect(result).toContain('₹300');
  });

  it('preserves store name and item names unchanged', () => {
    const text = 'DMart Hyderabad\nRice 5kg ₹200\nMilk 1L ₹65';
    const result = scrub(text);
    expect(result).toBe(text);
  });

  // ── Multiple PII types in one string ──────────────────────────────────────
  it('masks multiple PII types in a single string', () => {
    const text = 'Card: 4111 1111 1111 1111 Exp: 12/26 Email: x@y.com Phone: +91 9876543210';
    const result = scrub(text);
    expect(result).not.toContain('4111 1111 1111 1111');
    expect(result).not.toContain('12/26');
    expect(result).not.toContain('x@y.com');
    expect(result).not.toContain('9876543210');
  });
});
