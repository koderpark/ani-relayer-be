import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn() // PK
  userId: number;

  @Column()
  loginId: string;

  @Column()
  password: string;

  @Column()
  roomId: number = -1;
}
