import { Injectable } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';
import { DevicePayloadDto, JwtPayloadDto } from '../common/dto';
import { Notifications, Prisma } from '@prisma/client';
import { InfluxdbService } from '../influxdb/influxdb.service';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly rabbitmq: RabbitmqService,
    private readonly influxdb: InfluxdbService
  ) { }
  async create(createNotificationDto: CreateNotificationDto, user: DevicePayloadDto) {
    createNotificationDto.serial = user.sn;
    createNotificationDto.detail = this.setDetailMessage(createNotificationDto.message);
    this.rabbitmq.sendToNotification<CreateNotificationDto>('notification', createNotificationDto);
    return createNotificationDto;
  }

  async findAll(filter: string, current: string, total: string, user: JwtPayloadDto): Promise<Notifications[]> {
    const page = parseInt(current) || 1;
    const perpage = parseInt(total) || 10;
    let { conditions, key } = this.findCondition(user);
    key = `${key}${page}${perpage}`;
    if (filter) {
      switch (filter) {
        case "door":
          conditions = { ...conditions, ...{ message: { contains: "DOOR" } } };
          break;
        case "temp":
          conditions = { ...conditions, ...{ message: { contains: "TEMP" } } };
          break;
        case "internet":
          conditions = { ...conditions, ...{ message: { contains: "INTERNET" } } };
          break;
        case "plug":
          conditions = { ...conditions, ...{ message: { contains: "AC" } } };
          break;
        case "sdcard":
          conditions = { ...conditions, ...{ message: { contains: "SD" } } };
          break;
        case "report":
          conditions = { ...conditions, ...{ message: { contains: "REPORT" } } };
          break;
        default:
          throw new Error("Invalid filter");
      }
    } else {
      const cache = await this.redis.get(key);
      if (cache) return JSON.parse(cache);
    }
    const notification = await this.prisma.notifications.findMany({
      take: perpage,
      skip: (page - 1) * perpage,
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
    if (notification.length > 0 && !filter) await this.redis.set(key, JSON.stringify(notification), 15);
    return notification;
  }

  async findOne(serial: string) {
    const cache = await this.redis.get(`notification:${serial}`);
    if (cache) return JSON.parse(cache);
    const notification = await this.prisma.notifications.findMany({
      where: { serial },
      select: {
        message: true,
        detail: true,
        createAt: true
      },
      orderBy: { createAt: 'desc' }
    });
    if (notification.length > 0) await this.redis.set(`notification:${serial}`, JSON.stringify(notification), 10);
    return notification;
  }

  async findNotification(user: JwtPayloadDto, filter: string) {
    let query = `from(bucket: "${process.env.INFLUXDB_BUCKET}") `;
    if (filter) {
      query += `|> range(start: ${filter}T00:00:00Z, stop: ${filter}T23:59:59Z) `;
    } else {
      query += '|> range(start: -1d) ';
    }
    query += '|> filter(fn: (r) => r._measurement == "notification") ';
    query += '|> timeShift(duration: 7h, columns: ["_time"]) ';
    switch (user.role) {
      case 'SERVICE':
        query += '|> filter(fn: (r) => r.hospital != "HID-DEVELOPMENT" and r.ward != "WID-DEVELOPMENT") ';
        break;
      case 'ADMIN':
        query += `|> filter(fn: (r) => r.hospital == "${user.hosId}") `;
        break;
      case "USER":
        query += `|> filter(fn: (r) => r.ward == "${user.wardId}") `;
        break;
    }
    query += '|> filter(fn: (r) => r._field == "message") ';
    query += '|> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")';
    const history = await this.influxdb.queryData(query);
    return history;
  }

  async findCount(user: JwtPayloadDto) {
    let notification: Notifications[] = [];
    let temp = 0, door = 0, internet = 0, plug = 0, sdcard = 0;
    const { conditions, key } = this.findCondition(user);
    const cache = await this.redis.get(`count-${key}`);
    if (cache) {
      notification = JSON.parse(cache);
    } else {
      notification = await this.prisma.notifications.findMany({
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
      if (notification.length > 0) await this.redis.set(`count-${key}`, JSON.stringify(notification), 30);
    }
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
      case "USER":
        conditions = { device: { ward: user.wardId } };
        key = `notification:${user.wardId}`;
        break;
      case "LEGACY_USER":
        conditions = { device: { ward: user.wardId } };
        key = `notification:${user.wardId}`;
        break;
      case "LEGACY_ADMIN":
        conditions = { device: { hospital: user.hosId } };
        key = `notification:${user.hosId}`;
        break;
      case "ADMIN":
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

  private setDetailMessage(msg: string): string {
    const msgType = msg.split("/");
    let detailMessage = "";
    switch (msgType[0]) {
      case "TEMP":
        if (msgType[1] === "OVER") {
          detailMessage = "Temperature is too high";
        } else if (msgType[1] === "LOWER") {
          detailMessage = "Temperature is too low";
        } else {
          detailMessage = "Temperature returned to normal";
        }
        break;
      case "SD":
        detailMessage = msgType[1] === "ON" ? "SDCard connected" : "SDCard failed";
        break;
      case "AC":
        detailMessage = msgType[1] === "ON" ? "Power on" : "Power off";
        break;
      case "REPORT":
        detailMessage = `Report: ${msgType[1]}`;
        break;
      default:
        switch (msgType[1]) {
          case 'TEMP':
            detailMessage = `${msgType[0]}: Temperature `;
            if (msgType[2] === "OVER") {
              detailMessage += "is too high";
            } else if (msgType[2] === "LOWER") {
              detailMessage += "is too low";
            } else {
              detailMessage += "returned to normal";
            }
            break;
          case 'SENSOR': 
            detailMessage = `${msgType[0]}: ${msgType[2] === "ON" ? "Sensor disconnected" : "Sensor connected"}`;
            break;
          default:
            detailMessage = `${msgType[0]}: ${msgType[1]} is ${msgType[2] === "ON" ? "opened" : "closed"}`;
            break;
        }
    }
    return detailMessage;
  }
}
