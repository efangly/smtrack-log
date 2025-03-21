import { Controller, Get, Post, Body, Param, Put, Query } from '@nestjs/common';
import { DeviceService } from './device.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { OnlineDto } from '../logday/dto/online.dto';

@Controller('device')
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @Get('history')
  async findHistory(@Query('sn') sn: string, @Query('type') type: string, @Query('user') user: string, @Query('filter') filter: string) {
    return this.deviceService.findHistory(sn, type, user, filter);
  }

  @Post()
  async create(@Body() createDeviceDto: CreateDeviceDto) {
    return this.deviceService.create(createDeviceDto);
  }

  @Post('online')
  async online(@Body() data: OnlineDto) {
    return this.deviceService.onlineStatus(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDeviceDto: UpdateDeviceDto) {
    return this.deviceService.update(id, updateDeviceDto);
  }
}
