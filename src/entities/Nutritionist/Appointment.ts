import { Field, Int, ObjectType } from 'type-graphql';
import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { NutritionistProfile } from './NutritionistProfile';
import { AppointmentRequest } from './AppointmentRequest';

@ObjectType()
@Entity()
export class Appointment extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => String)
  @Column()
  date!: string;

  @Field(() => String)
  @Column()
  time!: string;

  @Field(() => Boolean)
  @Column({ default: true })
  isAvailable!: boolean;

  @Field()
  @Column()
  nutritionistId: number;

  @ManyToOne(() => NutritionistProfile, (nutritionist) => nutritionist.slots)
  nutritionistProfile: NutritionistProfile;

  @OneToMany(() => AppointmentRequest, (request) => request.slot)
  requests!: AppointmentRequest[];
}
