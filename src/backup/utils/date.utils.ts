import { format, startOfDay, endOfDay, parseISO, subDays } from 'date-fns';

export class DateUtils {
  /**
   * Get start of day (00:00:00) for a given date
   */
  static getStartOfDay(date: Date | string): Date {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return startOfDay(dateObj);
  }

  /**
   * Get end of day (23:59:59.999) for a given date
   */
  static getEndOfDay(date: Date | string): Date {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return endOfDay(dateObj);
  }

  /**
   * Get start of today
   */
  static getStartOfToday(): Date {
    return startOfDay(new Date());
  }

  /**
   * Get end of today
   */
  static getEndOfToday(): Date {
    return endOfDay(new Date());
  }

  /**
   * Format date to YYYY-MM-DD string
   */
  static formatDateString(date: Date | string): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'yyyy-MM-dd');
  }

  /**
   * Get date N days ago
   */
  static getDaysAgo(days: number): Date {
    return subDays(new Date(), days);
  }

  /**
   * Parse and validate date string
   */
  static parseDate(dateString: string): Date {
    try {
      const parsed = parseISO(dateString);
      if (isNaN(parsed.getTime())) {
        throw new Error('Invalid date format');
      }
      return parsed;
    } catch (error) {
      throw new Error(`Invalid date format: ${dateString}. Expected format: YYYY-MM-DD`);
    }
  }
}
