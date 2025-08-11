import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { format, toDate } from "date-fns";

@Injectable()
export class BackupService {
  constructor(private readonly prisma: PrismaService) { }
  private readonly logger = new Logger(BackupService.name);

  async findAll() {
    const [log, notification] = await this.prisma.$transaction([
      this.prisma.logDays.count({
        where: {
          sendTime: { lt: toDate(format(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()), "yyyy-MM-dd'T'HH:mm:ss'Z'")) }
        }
      }),
      this.prisma.notifications.count({
        where: {
          createAt: { lt: toDate(format(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()), "yyyy-MM-dd'T'HH:mm:ss'Z'")) }
        }
      })
    ]);
    return { log, notification };
  }

  async remove(date: string) {
    try {
      const [log, notification] = await this.prisma.$transaction([
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
      this.logger.log(`delete log success with ${log.count} and notification ${notification.count} data at ${date}`);
    } catch (error) {
      this.logger.error(`log delete failed with error: ${error.message}`);
    }
  }
}
