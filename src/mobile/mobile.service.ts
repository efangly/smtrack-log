import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { Prisma } from '@prisma/client';
import { JwtPayloadDto } from '../common/dto';

@Injectable()
export class MobileService {
  constructor(private readonly prisma: PrismaService, private readonly redis: RedisService) {}

  async findNotification(user: JwtPayloadDto) {
    let conditions: Prisma.NotificationsWhereInput | undefined = undefined;
    let key = "";
    switch (user.role) {
      case "USER":
        conditions = { device: { ward: user.wardId } };
        key = `mobile-notification:${user.wardId}`;
        break;
      case "GUEST":
        conditions = { device: { ward: user.wardId } };
        key = `mobile-notification:${user.wardId}`;
        break;
      case "LEGACY_USER":
        conditions = { device: { ward: user.wardId } };
        key = `mobile-notification:${user.wardId}`;
        break;
      case "LEGACY_ADMIN":
        conditions = { device: { hospital: user.hosId } };
        key = `mobile-notification:${user.hosId}`;
        break;
      case "ADMIN":
        conditions = { device: { hospital: user.hosId } };
        key = `mobile-notification:${user.hosId}`;
        break;
      case "SERVICE":
        conditions = { NOT: { device: { hospital: "HID-DEVELOPMENT" } } };
        key = "mobile-notification:HID-DEVELOPMENT";
        break;
      default:
        conditions = undefined;
        key = "mobile-notification";
    }
    const cache = await this.redis.get(key);
    if (cache) return JSON.parse(cache);
    const notification = await this.prisma.notifications.findMany({ 
      take: 99,
      where: conditions,
      include: { 
        device: {
          select: {
            name: true,
            ward: true,
            hospital: true
          }
        } 
      },
      orderBy: { createAt: 'desc' }
    });
    if (notification.length > 0) await this.redis.set(key, JSON.stringify(notification), 15);
    return notification;
  }

  async findWard(ward: string) {
    let conditions: Prisma.DevicesWhereInput | undefined = { ward };
    let key = `mobile:${ward}`;
    const cache = await this.redis.get(key);
    if (cache) return JSON.parse(cache);
    const mobile = await this.prisma.devices.findMany({
      where: conditions,
      select: {
        serial: true,
        name: true,
        ward: true,
        hospital: true,
        online: true,
        position: true,
        positionPic: true,
        log: { take: 1, orderBy: { createAt: 'desc' } },
        notification: { orderBy: { createAt: 'desc' } }
      },
      orderBy: { seq: 'asc' }
    });
    if (mobile.length > 0) await this.redis.set(key, JSON.stringify(mobile), 15);
    return mobile;
  }
}
