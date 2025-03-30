import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards';
import { MobileService } from './mobile.service';
import { JwtPayloadDto } from '../common/dto';

@Controller('mobile')
@UseGuards(JwtAuthGuard)
export class MobileController {
  constructor(private readonly mobileService: MobileService) {}

  @Get()
  async findNotification(@Request() req: { user: JwtPayloadDto }) {
    return this.mobileService.findNotification(req.user);
  }

  @Get(':id')
  async findOne(@Param('ward') ward: string) {
    return this.mobileService.findWard(ward);
  }
}
