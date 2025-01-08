import { ApiProperty } from '@nestjs/swagger';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @ApiProperty({
    example: 1,
    description: "user's PK",
    required: true,
  })
  @PrimaryGeneratedColumn() // PK
  id: number;

  @ApiProperty({
    example: 'koder0205@gmail.com',
    description: "user's email",
    required: true,
  })
  @Column()
  email: string;

  @ApiProperty({
    example: 'asdf',
    description: "user's password",
    required: true,
  })
  @Column()
  password: string;

  @ApiProperty({
    example: 'koderpark',
    description: "user's name",
    required: true,
  })
  @Column()
  name: string;
}
