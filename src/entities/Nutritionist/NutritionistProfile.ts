import {
  Entity,
  BaseEntity,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../User/User';
import { Appointment } from './Appointment';
import { Field, ObjectType } from 'type-graphql';
import { MealScheduler } from './MealScheduler';

@ObjectType()
@Entity()
export class NutritionistProfile extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @OneToMany(() => Appointment, (slot) => slot.nutritionistProfile)
  slots: Appointment[];

  @OneToMany(() => MealScheduler, (plan) => plan.nutritionist)
  nutritionPlans: MealScheduler[];
}
