import { DateUtils } from './date.utils';
import { parseISO, startOfDay, endOfDay, subDays, format } from 'date-fns';

describe('DateUtils', () => {
  const testDate = new Date('2024-01-15T12:30:45.123Z');
  const testDateString = '2024-01-15';

  describe('getStartOfDay', () => {
    it('should return start of day for Date object', () => {
      const result = DateUtils.getStartOfDay(testDate);
      expect(result).toEqual(startOfDay(testDate));
    });

    it('should return start of day for date string', () => {
      const result = DateUtils.getStartOfDay(testDateString);
      expect(result).toEqual(startOfDay(parseISO(testDateString)));
    });
  });

  describe('getEndOfDay', () => {
    it('should return end of day for Date object', () => {
      const result = DateUtils.getEndOfDay(testDate);
      expect(result).toEqual(endOfDay(testDate));
    });

    it('should return end of day for date string', () => {
      const result = DateUtils.getEndOfDay(testDateString);
      expect(result).toEqual(endOfDay(parseISO(testDateString)));
    });
  });

  describe('getStartOfToday', () => {
    it('should return start of today', () => {
      const result = DateUtils.getStartOfToday();
      const expected = startOfDay(new Date());
      expect(result.getDate()).toEqual(expected.getDate());
      expect(result.getMonth()).toEqual(expected.getMonth());
      expect(result.getFullYear()).toEqual(expected.getFullYear());
      expect(result.getHours()).toEqual(0);
      expect(result.getMinutes()).toEqual(0);
      expect(result.getSeconds()).toEqual(0);
    });
  });

  describe('getEndOfToday', () => {
    it('should return end of today', () => {
      const result = DateUtils.getEndOfToday();
      const expected = endOfDay(new Date());
      expect(result.getDate()).toEqual(expected.getDate());
      expect(result.getMonth()).toEqual(expected.getMonth());
      expect(result.getFullYear()).toEqual(expected.getFullYear());
      expect(result.getHours()).toEqual(23);
      expect(result.getMinutes()).toEqual(59);
      expect(result.getSeconds()).toEqual(59);
    });
  });

  describe('formatDateString', () => {
    it('should format Date object to YYYY-MM-DD', () => {
      const result = DateUtils.formatDateString(testDate);
      expect(result).toEqual('2024-01-15');
    });

    it('should format date string to YYYY-MM-DD', () => {
      const result = DateUtils.formatDateString(testDateString);
      expect(result).toEqual('2024-01-15');
    });
  });

  describe('getDaysAgo', () => {
    it('should return date N days ago', () => {
      const result = DateUtils.getDaysAgo(7);
      const expected = subDays(new Date(), 7);
      expect(format(result, 'yyyy-MM-dd')).toEqual(format(expected, 'yyyy-MM-dd'));
    });

    it('should return today for 0 days ago', () => {
      const result = DateUtils.getDaysAgo(0);
      const today = new Date();
      expect(format(result, 'yyyy-MM-dd')).toEqual(format(today, 'yyyy-MM-dd'));
    });
  });

  describe('parseDate', () => {
    it('should parse valid date string', () => {
      const result = DateUtils.parseDate('2024-01-15');
      expect(result).toEqual(parseISO('2024-01-15'));
    });

    it('should parse valid ISO date string', () => {
      const isoString = '2024-01-15T10:30:00Z';
      const result = DateUtils.parseDate(isoString);
      expect(result).toEqual(parseISO(isoString));
    });

    it('should throw error for invalid date string', () => {
      expect(() => DateUtils.parseDate('invalid-date')).toThrow('Invalid date format: invalid-date. Expected format: YYYY-MM-DD');
    });

    it('should throw error for empty string', () => {
      expect(() => DateUtils.parseDate('')).toThrow('Invalid date format: . Expected format: YYYY-MM-DD');
    });

    it('should throw error for malformed date', () => {
      expect(() => DateUtils.parseDate('2024-13-45')).toThrow('Invalid date format: 2024-13-45. Expected format: YYYY-MM-DD');
    });
  });
});
