import { IsString, MaxLength, IsOptional } from 'class-validator';

export class OnlineDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  clientid: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  event: string;
}

