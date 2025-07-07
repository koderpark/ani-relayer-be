import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Room } from '../../room/entities/room.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn() // PK
  userId: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  socketId: string;

  @ManyToOne(() => Room, (room) => room.users)
  room?: Room;
}

export const mockUser: User = {
  userId: 1,
  createdAt: new Date(),
  socketId: 'socket-123',
  room: null,
};
