import { Injectable, Logger } from '@nestjs/common';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { PrismaService } from '../prisma/prisma.service';
import { dateFormat } from '../common/utils';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';
import { OnlineDto } from '../logday/dto/online.dto';

@Injectable()
export class DeviceService {
  constructor(private readonly prisma: PrismaService, private readonly rabbitmq: RabbitmqService) { }
  private readonly logger = new Logger(DeviceService.name);

  async create(createDeviceDto: CreateDeviceDto) {
    return this.prisma.devices.create({
      data: {
        serial: createDeviceDto.id,
        ward: createDeviceDto.ward,
        hospital: createDeviceDto.hospital,
        staticName: createDeviceDto.staticName,
        name: createDeviceDto.name,
        status: createDeviceDto.status,
        seq: createDeviceDto.seq,
        firmware: createDeviceDto.firmware,
        remark: createDeviceDto.remark,
        createAt: dateFormat(new Date()),
        updateAt: dateFormat(new Date())
      }
    });
  }

  async onlineStatus(data: OnlineDto) {
    if (data.clientid.substring(0, 4) === "eTPV" || data.clientid.substring(0, 4) === "iTSV") {
      this.rabbitmq.sendToDevice('online', { sn: data.clientid, status: data.event === "client.connected" ? true : false });
    }
    return data;
  }

  async update(id: string, updateDeviceDto: UpdateDeviceDto) {
    return this.prisma.devices.update({
      where: { serial: id },
      data: updateDeviceDto
    });
  }
}
