import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateLogdayDto } from './dto/create-logday.dto';
import { UpdateLogdayDto } from './dto/update-logday.dto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';
import { dateFormat } from '../common/utils';
import { DevicePayloadDto, JwtPayloadDto } from '../common/dto';
import { format } from 'date-fns';

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
          log.sendTime = dateFormat(log.sendTime);
          this.rabbitmq.sendToLog<CreateLogdayDto>('logday', log);
          this.rabbitmq.sendToDevice<CreateLogdayDto>('log-device', log);
        }
      }
      return createLogdayDto.length;
    } else {
      if (format(createLogdayDto.sendTime, "yyyy") !== currentYear) throw new BadRequestException('Invalid year');
      createLogdayDto.serial = user.sn;
      createLogdayDto.sendTime = dateFormat(createLogdayDto.sendTime);
      this.rabbitmq.sendToLog<CreateLogdayDto>('logday', createLogdayDto);
      this.rabbitmq.sendToDevice<CreateLogdayDto>('log-device', createLogdayDto);
      return createLogdayDto;
    }
  }

  async findAll(user: JwtPayloadDto) {
    return this.prisma.logDays.findMany();
  }

  async findOne(id: string) {
    const cache = await this.redis.get(`log:${id}`);
    if (cache) return JSON.parse(cache);
    const log = await this.prisma.logDays.findMany({ where: { serial: id } });
    await this.redis.set(`log:${id}`, JSON.stringify(log), 15);
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
