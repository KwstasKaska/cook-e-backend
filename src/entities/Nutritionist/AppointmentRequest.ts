import { Field, Int, ObjectType, registerEnumType } from 'type-graphql';
import {
  BaseEntity,
  Column,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Entity,
} from 'typeorm';
import { User } from '../User/User';
import { Appointment } from './Appointment';

export enum AppointmentStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

registerEnumType(AppointmentStatus, {
  name: 'AppointmentStatus',
});

@ObjectType()
@Entity()
export class AppointmentRequest extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column()
  slotId!: number;

  @ManyToOne(() => Appointment, (slot) => slot.requests)
  slot!: Appointment;

  @Field()
  @Column()
  clientId!: number;

  @ManyToOne(() => User, (user) => user.appointmentReqs)
  client!: User;

  @Field(() => AppointmentStatus)
  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING,
  })
  status!: AppointmentStatus;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  comment?: string;

  @Field(() => String)
  @CreateDateColumn()
  requestedAt!: Date;
}
