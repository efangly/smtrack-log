import { Controller, Get, Param, Delete, Query, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { BackupService } from './backup.service';
import {
  BackupCountResponse,
  DailySummaryResponse,
  BackupDeleteResponse,
  GetDailySummaryDto,
  DeleteBackupDto,
  GetBackupCountDto
} from './dto';

@Controller('backup')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  /**
   * Get backup count (backward compatibility)
   */
  @Get()
  async findAll(): Promise<BackupCountResponse> {
    return this.backupService.findAll();
  }

  /**
   * Get backup count with optional date filter
   */
  @Get('count')
  async getBackupCount(@Query() dto: GetBackupCountDto): Promise<BackupCountResponse> {
    return this.backupService.getBackupCount(dto);
  }

  /**
   * Get daily summary of logs and notifications grouped by device
   */
  @Get('summary/:date')
  async getDailySummary(@Param() dto: GetDailySummaryDto): Promise<DailySummaryResponse> {
    return this.backupService.getDailySummary(dto);
  }

  /**
   * Delete backup data before specified date (backward compatibility)
   */
  @Delete(':beforeDate')
  async remove(@Param('beforeDate') beforeDate: string): Promise<BackupDeleteResponse> {
    return this.backupService.remove(beforeDate);
  }

  /**
   * Delete backup data with body payload
   */
  @Delete()
  @HttpCode(HttpStatus.OK)
  async deleteBackup(@Body() dto: DeleteBackupDto): Promise<BackupDeleteResponse> {
    return this.backupService.deleteBackup(dto);
  }
}
