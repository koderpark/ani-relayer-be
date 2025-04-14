import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn() // PK
  userId: number;

  @Column()
  loginId: string;

  @Column()
  password: string;

  @Column({ default: -1 })
  roomId: number;
}
