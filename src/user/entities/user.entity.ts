import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn() // PK
  key: number;

  @Column()
  id: string;

  @Column()
  password: string;
}
