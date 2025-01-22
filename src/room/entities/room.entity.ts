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

  @Column()
  cntViewer: number = 0;

  @Column()
  vidName?: string;

  @Column()
  vidUrl?: string;

  @Column()
  vidEpisode?: number;
}
