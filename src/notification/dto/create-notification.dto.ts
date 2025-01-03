import { IsString, IsBoolean, MaxLength, IsOptional, IsDate, IsNotEmpty } from 'class-validator';

export class CreateNotificationDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  id: string;
  
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  serial: string;
  
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  message: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  detail: string;
  
  @IsOptional()
  @IsBoolean()
  status: boolean;  

  @IsDate()
  @IsOptional() 
  createAt: Date;

  @IsDate()
  @IsOptional()
  updateAt: Date;
}
