import { Injectable, Inject, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DateUtils } from './utils/date.utils';
import { JsonLogger } from '../common/logger/json.logger';
import {
  BackupCountResponse,
  DailySummaryResponse,
  DeviceDailySummary,
  BackupDeleteResponse,
  GetDailySummaryDto,
  DeleteBackupDto,
  GetBackupCountDto
} from './dto';

@Injectable()
export class BackupService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(JsonLogger) private readonly logger: JsonLogger
  ) {}

  /**
   * Get count of logs and notifications before a specific date (default: today)
   */
  async getBackupCount(dto?: GetBackupCountDto): Promise<BackupCountResponse> {
    try {
      const beforeDate = dto?.beforeDate 
        ? DateUtils.parseDate(dto.beforeDate)
        : DateUtils.getStartOfToday();

      const [log, notification] = await this.prisma.$transaction([
        this.prisma.logDays.count({
          where: {
            sendTime: { lt: beforeDate }
          }
        }),
        this.prisma.notifications.count({
          where: {
            createAt: { lt: beforeDate }
          }
        })
      ]);

      return { log, notification };
    } catch (error) {
      this.logger.logError(`Failed to get backup count: ${error.message}`, error, 'BackupService');
      if (error.message.includes('Invalid date format')) {
        throw new BadRequestException(error.message);
      }
      throw new InternalServerErrorException('Failed to retrieve backup count');
    }
  }

  /**
   * Get daily summary of logs and notifications grouped by device
   */
  async getDailySummary(dto: GetDailySummaryDto): Promise<DailySummaryResponse> {
    try {
      const targetDate = DateUtils.parseDate(dto.date);
      const startOfDay = DateUtils.getStartOfDay(targetDate);
      const endOfDay = DateUtils.getEndOfDay(targetDate);

      // Get all devices with their logs and notifications for the specific day
      const devices = await this.prisma.devices.findMany({
        include: {
          log: {
            where: {
              sendTime: {
                gte: startOfDay,
                lte: endOfDay
              }
            }
          },
          notification: {
            where: {
              createAt: {
                gte: startOfDay,
                lte: endOfDay
              }
            }
          }
        }
      });

      const deviceSummaries: DeviceDailySummary[] = devices.map(device => {
        const logs = device.log;
        const notifications = device.notification;

        // Calculate averages
        const avgTemperature = logs.length > 0 
          ? logs.reduce((sum, log) => sum + log.temp, 0) / logs.length 
          : undefined;
        
        const avgHumidity = logs.length > 0 
          ? logs.reduce((sum, log) => sum + log.humidity, 0) / logs.length 
          : undefined;

        // Get latest battery level
        const latestLog = logs.sort((a, b) => b.sendTime.getTime() - a.sendTime.getTime())[0];
        const batteryLevel = latestLog?.battery;

        // Get last seen time
        const lastSeen = latestLog?.sendTime;

        return {
          deviceSerial: device.serial,
          deviceName: device.name || device.staticName,
          hospital: device.hospital,
          ward: device.ward,
          date: DateUtils.formatDateString(targetDate),
          logCount: logs.length,
          notificationCount: notifications.length,
          avgTemperature: avgTemperature ? Math.round(avgTemperature * 100) / 100 : undefined,
          avgHumidity: avgHumidity ? Math.round(avgHumidity * 100) / 100 : undefined,
          batteryLevel,
          isOnline: device.online,
          lastSeen
        };
      });

      const totalLogs = deviceSummaries.reduce((sum, device) => sum + device.logCount, 0);
      const totalNotifications = deviceSummaries.reduce((sum, device) => sum + device.notificationCount, 0);

      const response: DailySummaryResponse = {
        date: DateUtils.formatDateString(targetDate),
        totalDevices: devices.length,
        totalLogs,
        totalNotifications,
        deviceSummaries
      };

      return response;
    } catch (error) {
      this.logger.logError(`Failed to get daily summary for ${dto.date}: ${error.message}`, error, 'BackupService');
      if (error.message.includes('Invalid date format')) {
        throw new BadRequestException(error.message);
      }
      throw new InternalServerErrorException('Failed to retrieve daily summary');
    }
  }

  /**
   * Delete logs and notifications before a specific date
   */
  async deleteBackup(dto: DeleteBackupDto): Promise<BackupDeleteResponse> {
    try {
      const beforeDate = DateUtils.parseDate(dto.beforeDate);
      
      const [deletedLogs, deletedNotifications] = await this.prisma.$transaction([
        this.prisma.logDays.deleteMany({
          where: {
            sendTime: { lt: beforeDate }
          }
        }),
        this.prisma.notifications.deleteMany({
          where: {
            createAt: { lt: beforeDate }
          }
        })
      ]);

      const response: BackupDeleteResponse = {
        deletedLogs: deletedLogs.count,
        deletedNotifications: deletedNotifications.count,
        message: `Successfully deleted ${deletedLogs.count} logs and ${deletedNotifications.count} notifications before ${DateUtils.formatDateString(beforeDate)}`
      };

      return response;
    } catch (error) {
      this.logger.logError(`Backup deletion failed: ${error.message}`, error, 'BackupService');
      if (error.message.includes('Invalid date format')) {
        throw new BadRequestException(error.message);
      }
      throw new InternalServerErrorException('Failed to delete backup data');
    }
  }

  // Backward compatibility methods
  async findAll(): Promise<BackupCountResponse> {
    return this.getBackupCount();
  }

  async remove(date: string): Promise<BackupDeleteResponse> {
    return this.deleteBackup({ beforeDate: date });
  }
}
