import { normalizeVoiceInput, normalizeWhatsAppInput } from '../../src/services/inputNormalizer';

describe('InputNormalizer', () => {
  describe('normalizeVoiceInput', () => {
    it('returns NormalizedInput with voice channel', () => {
      const result = normalizeVoiceInput('001', 'CA123', 'quiero una Super Smash Bros', '+34600000001');
      expect(result).toEqual({
        tenantSlug: '001',
        sessionId: 'CA123',
        channel: 'voice',
        text: 'quiero una Super Smash Bros',
        phoneNumber: '+34600000001',
      });
    });

    it('trims whitespace from transcript', () => {
      const result = normalizeVoiceInput('001', 'CA123', '  hola  ', '+34600000001');
      expect(result!.text).toBe('hola');
    });

    it('returns null for empty transcript', () => {
      const result = normalizeVoiceInput('001', 'CA123', '   ', '+34600000001');
      expect(result).toBeNull();
    });
  });

  describe('normalizeWhatsAppInput', () => {
    it('returns NormalizedInput with whatsapp channel', () => {
      const result = normalizeWhatsAppInput('001', '+34600000001', 'una chupacabras por favor');
      expect(result).toEqual({
        tenantSlug: '001',
        sessionId: '+34600000001',
        channel: 'whatsapp',
        text: 'una chupacabras por favor',
        phoneNumber: '+34600000001',
      });
    });

    it('returns null for empty message', () => {
      const result = normalizeWhatsAppInput('001', '+34600000001', '');
      expect(result).toBeNull();
    });
  });
});
