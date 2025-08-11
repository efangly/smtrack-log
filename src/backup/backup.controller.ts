import { Controller, Get, Param, Delete } from '@nestjs/common';
import { BackupService } from './backup.service';

@Controller('backup')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get()
  async findAll() {
    return this.backupService.findAll();
  }

  @Delete(':date')
  async remove(@Param('date') date: string) {
    return this.backupService.remove(date);
  }
}
