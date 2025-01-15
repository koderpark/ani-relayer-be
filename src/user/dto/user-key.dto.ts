import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class UserKeyDto {
  @IsNumber()
  @IsNotEmpty()
  id: number;
}
