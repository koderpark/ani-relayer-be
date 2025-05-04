import { Entity, Column, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity()
export class Room {
  @PrimaryGeneratedColumn() // PK
  id: number;

  @Column()
  ownerId: number;

  @Column({ default: 1 })
  cntViewer: number;

  @Column()
  name: string;

  @Column({ default: '' })
  vidName: string;

  @Column({ default: '' })
  vidUrl: string;

  @Column({ default: -1 })
  vidEpisode: number;

  @Column({ default: null, select: false })
  password?: number;
}
