import {
  Entity,
  Column,
  ManyToOne,
  CreateDateColumn,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { Room } from '../../room/entities/room.entity';
import { mockRoom } from '../../room/entities/room.entity';

@Entity()
export class User {
  @PrimaryColumn() // PK, socket.id
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  name: string;

  @ManyToOne(() => Room, (room) => room.users, { onDelete: 'SET NULL' })
  room?: Room;

  @OneToOne(() => Room, (room) => room.owner, { onDelete: 'SET NULL' })
  host?: Room;
}

export const mockUser: User = {
  id: 'socket-123',
  createdAt: new Date(),
  name: 'koderpark',
  room: mockRoom,
  host: mockRoom,
};
