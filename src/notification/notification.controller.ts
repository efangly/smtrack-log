import { Controller, Get, Post, Body, Put, Param, Delete, HttpStatus, HttpCode, Request, UseGuards, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { DeviceJwtAuthGuard, JwtAuthGuard, RolesGuard } from '../common/guards';
import { DevicePayloadDto, JwtPayloadDto } from '../common/dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @UseGuards(DeviceJwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createNotificationDto: CreateNotificationDto, @Request() req: { user: DevicePayloadDto }) {
    return this.notificationService.create(createNotificationDto, req.user);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Query('filter') filter: string,
    @Query('page') page: string,
    @Query('perpage') perpage: string,
    @Request() req: { user: JwtPayloadDto }
  ) {
    return this.notificationService.findAll(filter, page, perpage, req.user);
  }

  @Get(':sn')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('sn') sn: string) {
    return this.notificationService.findOne(sn);
  }

  @Get('history/filter')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER, Role.SERVICE, Role.ADMIN, Role.USER)
  async findHistory(@Request() req: { user: JwtPayloadDto }, @Query('filter') filter: string) {
    return this.notificationService.findNotification(req.user, filter);
  }

  @Get('dashboard/count')
  @UseGuards(JwtAuthGuard)
  async findDashboard(@Request() req: { user: JwtPayloadDto }) {
    return this.notificationService.findCount(req.user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER, Role.SERVICE)
  async update(@Param('id') id: string, @Body() updateNotificationDto: UpdateNotificationDto) {
    return this.notificationService.update(id, updateNotificationDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER, Role.SERVICE)
  async remove(@Param('id') id: string) {
    return this.notificationService.remove(id);
  }
}
