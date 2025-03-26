import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateLogdayDto } from './dto/create-logday.dto';
import { UpdateLogdayDto } from './dto/update-logday.dto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';
import { DevicePayloadDto, JwtPayloadDto } from '../common/dto';
import { format } from 'date-fns';
import { Prisma } from '@prisma/client';

@Injectable()
export class LogdayService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly rabbitmq: RabbitmqService
  ) {}
  async create(createLogdayDto: CreateLogdayDto | CreateLogdayDto[], user: DevicePayloadDto) {
    const currentYear = format(new Date(), "yyyy");
    if (Array.isArray(createLogdayDto)) {
      for (const log of createLogdayDto) {
        if (format(log.sendTime, "yyyy") === currentYear) {
          log.serial = user.sn;
          log.sendTime = log.sendTime;
          this.rabbitmq.sendToLog<CreateLogdayDto>('logday', log);
          this.rabbitmq.sendToDevice<CreateLogdayDto>('log-device', log);
        }
      }
      return createLogdayDto.length;
    } else {
      if (format(createLogdayDto.sendTime, "yyyy") !== currentYear) {
        throw new BadRequestException(`Invalid year expect ${currentYear} but got ${format(createLogdayDto.sendTime, "yyyy")}, ${createLogdayDto.serial}`);
      }
      createLogdayDto.serial = user.sn;
      createLogdayDto.sendTime = createLogdayDto.sendTime;
      this.rabbitmq.sendToLog<CreateLogdayDto>('logday', createLogdayDto);
      this.rabbitmq.sendToDevice<CreateLogdayDto>('log-device', createLogdayDto);
      return createLogdayDto;
    }
  }

  async findAll(filter: string, current: string, total: string, ward: string) {
    if (!ward) throw new BadRequestException("Ward is required");
    const page = parseInt(current) || 1;
    const perpage = parseInt(total) || 10;
    let conditions: Prisma.DevicesWhereInput | undefined = { ward };
    let key = `mobile:${ward}${page}${perpage}`;
    if (filter) {
      conditions = { ...conditions, ...{ OR: [ { name: { contains: filter } }, { id: { contains: filter } } ] } };
    } else {
      const cache = await this.redis.get(key);
      if (cache) return JSON.parse(cache);
    }
    const mobile = await this.prisma.devices.findMany({
      where: conditions,
      select: {
        serial: true,
        name: true,
        ward: true,
        hospital: true,
        online: true,
        log: { take: 1, orderBy: { createAt: 'desc' } },
        notification: { orderBy: { createAt: 'desc' } }
      },
      orderBy: { seq: 'asc' }
    });
    if (mobile.length > 0 && !filter) await this.redis.set(key, JSON.stringify(mobile), 30);
    return mobile;
  }

  async findOne(id: string) {
    const cache = await this.redis.get(`log:${id}`);
    if (cache) return JSON.parse(cache);
    const log = await this.prisma.logDays.findMany({ where: { serial: id }, orderBy: { sendTime: 'desc' } });
    if (log.length > 0) await this.redis.set(`log:${id}`, JSON.stringify(log), 30);
    return log;
  }

  async update(id: string, updateLogdayDto: UpdateLogdayDto) {
    return this.prisma.logDays.update({
      where: { id },
      data: updateLogdayDto
    });
  }

  async remove(id: string) {
    return this.prisma.logDays.delete({ where: { id } });
  }
}
