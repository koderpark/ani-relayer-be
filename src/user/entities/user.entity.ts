import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Room } from 'src/room/entities/room.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn() // PK
  userId: number;

  @Column()
  socketId: string;

  @ManyToOne(() => Room, (room) => room.users)
  room?: Room;
}
