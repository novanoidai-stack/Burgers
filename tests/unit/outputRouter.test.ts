import { buildTwilioAudioMessage, estimateAudioDurationMs } from '../../src/services/outputRouter';

describe('OutputRouter', () => {
  describe('buildTwilioAudioMessage', () => {
    it('wraps base64 audio in Twilio media event format', () => {
      const msg = buildTwilioAudioMessage('streamSid123', 'abc123base64');
      const parsed = JSON.parse(msg);
      expect(parsed.event).toBe('media');
      expect(parsed.streamSid).toBe('streamSid123');
      expect(parsed.media.payload).toBe('abc123base64');
    });
  });

  describe('estimateAudioDurationMs', () => {
    it('estimates duration from buffer length (ulaw 8000Hz mono)', () => {
      const buffer = Buffer.alloc(8000); // 1 second at 8000 bytes/s
      expect(estimateAudioDurationMs(buffer)).toBe(1000);
    });
  });
});
