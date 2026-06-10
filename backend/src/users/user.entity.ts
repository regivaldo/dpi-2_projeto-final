import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Talk } from '../talks/talk.entity';
import { UserRole } from './enums/user-role.enum';
import { UserTitle } from './enums/user-title.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'full_name', length: 150 })
  fullName: string;

  @Column({ name: 'birth_date', type: 'date' })
  birthDate: string;

  @Column({ unique: true, length: 150 })
  email: string;

  @Column({ name: 'password_hash', select: false })
  passwordHash: string;

  @Column({ length: 20 })
  phone: string;

  @Column({
    type: 'enum',
    enum: UserTitle,
  })
  title: UserTitle;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  role: UserRole;

  @ManyToMany(() => Talk, (talk) => talk.attendees)
  talks: Talk[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
