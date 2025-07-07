import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { mockUser, User } from '../../user/entities/user.entity';

@Entity()
export class Room {
  @PrimaryGeneratedColumn() // PK
  id: number;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  name: string;

  @Column({ default: null, select: false })
  password?: number;

  @Column({ default: null })
  vidTitle: string;

  @Column({ default: null })
  vidEpisode: string;

  @Column({ type: 'json', default: null })
  vidData: VidData;

  @OneToMany(() => User, (user) => user.room)
  users: User[];

  @OneToOne(() => User, (user) => user.host)
  owner: User;
}

export interface VidData {
  url: string;
  speed: number;
  time: number;
  isPaused: boolean;
}

export interface Video {
  title: string;
  episode: string;
  url: string;
  speed: number;
  time: number;
  isPaused: boolean;
}

export const mockRoom: Room = {
  id: 1,
  updatedAt: new Date(),
  name: 'Test Room',
  password: 1234,
  vidTitle: null,
  vidEpisode: null,
  vidData: null,
  users: [mockUser],
  owner: mockUser,
};