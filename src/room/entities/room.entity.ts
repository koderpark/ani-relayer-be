import { Entity, Column, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity()
@Unique(['code'])
export class Room {
  @PrimaryGeneratedColumn() // PK
  roomId: number;

  @Column()
  ownerId: number;

  @Column() // random-generate digit code to login.
  code: number;

  @Column({ default: 1 })
  cntViewer: number;

  @Column()
  roomName: string;

  @Column({ default: '' })
  vidName: string;

  @Column({ default: '' })
  vidUrl: string;

  @Column({ default: -1 })
  vidEpisode: number;
}
