import { Entity, Column, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity()
export class Room {
  @PrimaryGeneratedColumn() // PK
  id: number;

  @Column()
  ownerId: number;

  @Column()
  name: string;

  @Column({ default: null, select: false })
  password?: number;

  @Column({ default: '' })
  vidName: string;

  @Column({ default: '' })
  vidUrl: string;

  @Column({ default: -1 })
  vidEpisode: number;
}
