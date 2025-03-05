import { IsString, IsBoolean, MaxLength, IsOptional, IsDate, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateLogdayDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  id: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  serial: string;

  @IsOptional()
  @IsNumber()
  temp: number;

  @IsOptional()
  @IsNumber()
  tempDisplay: number;

  @IsOptional()
  @IsNumber()
  humidity: number;

  @IsOptional()
  @IsNumber()
  humidityDisplay: number;

  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  sendTime: Date;

  @IsOptional()
  @IsBoolean()
  plug: boolean;

  @IsOptional()
  @IsBoolean()
  door1: boolean;

  @IsOptional()
  @IsBoolean()
  door2: boolean;

  @IsOptional()
  @IsBoolean()
  door3: boolean;

  @IsOptional()
  @IsBoolean()
  internet: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  probe: string;

  @IsOptional()
  @IsNumber()
  battery: number;

  @IsOptional()
  @IsNumber()
  tempInternal: number;

  @IsOptional()
  @IsBoolean()
  extMemory: boolean;
  
  @IsDate()
  @IsOptional()
  createAt: Date;

  @IsDate()
  @IsOptional()
  updateAt: Date;
}

