import { IsDateString, IsOptional } from 'class-validator';

export class GetDailySummaryDto {
  @IsDateString()
  date: string;
}

export class DeleteBackupDto {
  @IsDateString()
  beforeDate: string;
}

export class GetBackupCountDto {
  @IsOptional()
  @IsDateString()
  beforeDate?: string;
}
