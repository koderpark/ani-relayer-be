import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn() // PK
  userId: number;

  @Column()
  socketId: string;

  @Column({ default: -1 })
  roomId: number;
}
