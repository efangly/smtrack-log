import { Injectable } from '@nestjs/common';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { PrismaService } from '../prisma/prisma.service';
import { dateFormat } from '../common/utils';

@Injectable()
export class DeviceService {
  constructor(private readonly prisma: PrismaService) { }
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

  async findAll() {
    return this.prisma.devices.findMany();
  }

  async findOne(id: string) {
    return `This action returns a #${id} device`;
  }

  async update(id: string, updateDeviceDto: UpdateDeviceDto) {
    return this.prisma.devices.update({
      where: { serial: id },
      data: updateDeviceDto
    });
  }

  async remove(id: string) {
    return this.prisma.devices.delete({ where: { serial: id } });
  }
}
