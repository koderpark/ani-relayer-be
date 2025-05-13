import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Room {
  @PrimaryGeneratedColumn() // PK
  id: number;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  ownerId: number;

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
