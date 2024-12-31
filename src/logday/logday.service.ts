import { Injectable } from '@nestjs/common';
import { CreateLogdayDto } from './dto/create-logday.dto';
import { UpdateLogdayDto } from './dto/update-logday.dto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';
import { dateFormat } from '../common/utils';
import { JwtPayloadDto } from '../common/dto';

@Injectable()
export class LogdayService {
  constructor(
    private readonly prisma: PrismaService, 
    private readonly redis: RedisService,
    private readonly rabbitmq: RabbitmqService
  ) {}
  async create(createLogdayDto: CreateLogdayDto) {
    createLogdayDto.sendTime = dateFormat(createLogdayDto.sendTime);
    createLogdayDto.createAt = dateFormat(new Date());
    createLogdayDto.updateAt = dateFormat(new Date());
    await this.rabbitmq.send(process.env.NODE_ENV === "production" ? 'logday' : 'logday-test', JSON.stringify(createLogdayDto));
    return createLogdayDto;
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
