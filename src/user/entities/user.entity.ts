import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn() // PK
  id: number;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;
}
