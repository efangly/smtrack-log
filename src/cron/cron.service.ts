import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { format, toDate } from "date-fns";

@Injectable()
export class CronService {
  constructor(private readonly prisma: PrismaService) { }
  private readonly logger = new Logger(CronService.name);

  @Cron('0 0 * * *')
  async handleCron() {
    try {
      const [ log, notification ] = await this.prisma.$transaction([
        this.prisma.logDays.deleteMany({
          where: {
            sendTime: { lt: toDate(format(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()), "yyyy-MM-dd'T'HH:mm:ss'Z'")) }
          }
        }),
        this.prisma.notifications.deleteMany({
          where: {
            createAt: { lt: toDate(format(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()), "yyyy-MM-dd'T'HH:mm:ss'Z'")) }
          }
        })
      ]);
      this.logger.log(`delete log success with ${log.count} and notification ${notification.count} data at ${format(new Date(), "yyyy-MM-dd'T'HH:mm:ss'Z'")}`);
    } catch (error) {
      this.logger.error(`log delete failed with error: ${error.message}`); 
    }
  }s
}