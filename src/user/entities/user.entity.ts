import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  OneToOne,
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

  @ManyToOne(() => Room, (room) => room.users, { onDelete: 'SET NULL' })
  room?: Room;

  @OneToOne(() => Room, (room) => room.owner, { onDelete: 'SET NULL' })
  host?: Room;
}

export const mockUser: User = {
  userId: 1,
  createdAt: new Date(),
  socketId: 'socket-123',
  room: null,
  host: null,
};
