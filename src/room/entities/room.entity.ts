import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { mockUser, User } from '../../user/entities/user.entity';
import { VidData } from '../../interface';

@Entity()
export class Room {
  @PrimaryGeneratedColumn() // PK
  id: number;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  @Column()
  name: string;

  @Column({ default: null, select: false })
  password?: number;

  @Column({ default: null })
  vidTitle: string;

  @Column({ default: null })
  vidEpisode: string;

  @Column({ default: null })
  vidStartedAt: Date | null;

  @Column({ default: null })
  vidLastUpdatedAt: Date | null;

  @Column({ type: 'json', default: null })
  vidData: VidData;

  @OneToMany(() => User, (user) => user.room, { nullable: true })
  users: User[];

  @OneToOne(() => User, (user) => user.host, { nullable: true })
  @JoinColumn()
  host: User;

  @Column({ type: 'uuid', generated: 'uuid' })
  uuid: string;
}

export const mockRoom: Room = {
  id: 1,
  updatedAt: new Date(),
  deletedAt: null,
  name: 'Test Room',
  password: 1234,
  uuid: '123e4567-e89b-12d3-a456-426614174000',
  vidTitle: null,
  vidEpisode: null,
  vidStartedAt: null,
  vidLastUpdatedAt: null,
  vidData: null,
  users: [mockUser],
  host: mockUser,
};