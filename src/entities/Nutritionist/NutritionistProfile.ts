import {
  Entity,
  BaseEntity,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
  Column,
} from 'typeorm';
import { User } from '../User/User';
import { Appointment } from './Appointment';
import { Field, Int, ObjectType } from 'type-graphql';
import { MealScheduler } from './MealScheduler';

@ObjectType()
@Entity()
export class NutritionistProfile extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => User, { nullable: true })
  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  phone?: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  bio_el?: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  bio_en?: string;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  city_el?: string;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  city_en?: string;

  @OneToMany(() => Appointment, (slot) => slot.nutritionistProfile)
  slots: Appointment[];

  @OneToMany(() => MealScheduler, (plan) => plan.nutritionist)
  nutritionPlans: MealScheduler[];
}
