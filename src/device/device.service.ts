import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { PrismaService } from '../prisma/prisma.service';
import { dateFormat } from '../common/utils';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';
import { OnlineDto } from '../logday/dto/online.dto';
import { InfluxdbService } from '../influxdb/influxdb.service';

@Injectable()
export class DeviceService {
  constructor(
    private readonly prisma: PrismaService, 
    private readonly rabbitmq: RabbitmqService,
    private readonly influxdb: InfluxdbService
  ) {}

  async create(createDeviceDto: CreateDeviceDto) {
    return this.prisma.devices.create({
      data: {
        serial: createDeviceDto.serial,
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

  async findHistory(sn: string, type: string, user: string, filter: string) {
    if (!sn) throw new BadRequestException('Invalid sn');
    let query = `from(bucket: "${process.env.INFLUXDB_BUCKET}") `;
    if (filter) {
      query += `|> range(start: ${filter}T00:00:00Z, stop: ${filter}T23:59:59Z) `;
    } else {
      query += '|> range(start: -1d) ';
    }
    query += '|> timeShift(duration: 7h, columns: ["_time"]) ';
    query += '|> filter(fn: (r) => r._measurement == "history") ';
    query += `|> filter(fn: (r) => r.service == "${sn}") `;
    if (type) `|> filter(fn: (r) => r.type == "${type}") `;
    if (user) `|> filter(fn: (r) => r.user == "${user}") `;
    query += '|> filter(fn: (r) => r._field == "message") ';
    query += '|> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value") ';
    query += '|> keep(columns: ["_time", "message"])';
    return this.influxdb.queryData(query);
  }
}
