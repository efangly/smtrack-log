import { PartialType } from '@nestjs/mapped-types';
import { CreateLogdayDto } from './create-logday.dto';

export class UpdateLogdayDto extends PartialType(CreateLogdayDto) {}
