import { Injectable } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';
import { dateFormat } from '../common/utils';
import { DevicePayloadDto, JwtPayloadDto } from '../common/dto';
import { Notifications, Prisma } from '@prisma/client';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly rabbitmq: RabbitmqService
  ) {}
  async create(createNotificationDto: CreateNotificationDto, user: DevicePayloadDto) {
    createNotificationDto.serial = user.sn;
    createNotificationDto.createAt = dateFormat(new Date());
    createNotificationDto.updateAt = dateFormat(new Date());
    await this.rabbitmq.send(process.env.NODE_ENV === 'production' ? 'notification' : 'notification-test', JSON.stringify(createNotificationDto));
    return createNotificationDto;
  }

  async findAll(user: JwtPayloadDto): Promise<Notifications[]> {
    const { conditions, key } = this.findCondition(user);
    const cache = await this.redis.get(key);
    if (cache) return JSON.parse(cache);
    const notification = await this.prisma.notifications.findMany({ 
      where: conditions,
      orderBy: { createAt: 'desc' }
    });
    if (notification.length === 0) return notification;
    await this.redis.set(key, JSON.stringify(notification), 10);
    return notification;
  }

  async findCount(user: JwtPayloadDto) {
    const notification = await this.findAll(user);
    let temp = 0,door = 0, internet = 0, plug = 0, sdcard = 0;
    if (notification.length === 0) return { temp, door, internet, plug, sdcard };
    notification.forEach(e => {
      const msgType = e.message.split("/");
      switch (msgType[0]) {
        case "SD":
          if (msgType[1] === "OFF") sdcard++;
          break;
        case "AC":
          if (msgType[1] === "OFF") plug++;
          break;
        case "INTERNET":
          if (msgType[1] === "OFF") internet++;
          break;
        default:
          if (msgType[1] === "TEMP") {
            if (msgType[2] === "OVER") {
              temp++;
            } else if (msgType[2] === "LOWER") {
              temp++;
            }
          } else {
            if (msgType[2] === "ON") door++;
          }
      }
    });
    return { temp, door, internet, plug, sdcard };
  }

  async update(id: string, updateNotificationDto: UpdateNotificationDto) {
    return this.prisma.notifications.update({
      where: { id },
      data: updateNotificationDto
    });
  }

  async remove(id: string) {
    return this.prisma.notifications.delete({ where: { id } });
  }

  private findCondition(user: JwtPayloadDto): { conditions: Prisma.NotificationsWhereInput | undefined, key: string } {
    let conditions: Prisma.NotificationsWhereInput | undefined = undefined;
    let key = "";
    switch (user.role) {
      case "LEGACY_USER":
        conditions = { device: { ward: user.wardId } };
        key = `notification:${user.wardId}`;
        break;
      case "LEGACY_ADMIN":
        conditions = { device: { hospital: user.hosId } };
        key = `notification:${user.hosId}`;
        break;
      case "SERVICE":
        conditions = { NOT: { device: { hospital: "HID-DEVELOPMENT" } } };
        key = "notification:HID-DEVELOPMENT";
        break;
      default:
        conditions = undefined;
        key = "notification";
    }
    return { conditions, key };
  }
}
