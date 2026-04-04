import { Field, Int, ObjectType, registerEnumType } from 'type-graphql';
import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../User/User';
import { NutritionistProfile } from './NutritionistProfile';

export enum DayOfWeek {
  MONDAY = 'Monday',
  TUESDAY = 'Tuesday',
  WEDNESDAY = 'Wednesday',
  THURSDAY = 'Thursday',
  FRIDAY = 'Friday',
  SATURDAY = 'Saturday',
  SUNDAY = 'Sunday',
}

export enum MealType {
  BREAKFAST = 'Breakfast',
  SNACK = 'Snack',
  LUNCH = 'Lunch',
  AFTERNOON = 'Afternoon',
  DINNER = 'Dinner',
}

registerEnumType(DayOfWeek, { name: 'DayOfWeek' });
registerEnumType(MealType, { name: 'MealType' });

@ObjectType()
@Entity()
export class MealScheduler extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => DayOfWeek)
  @Column({ type: 'enum', enum: DayOfWeek })
  day!: DayOfWeek;

  @Field(() => MealType)
  @Column({ type: 'enum', enum: MealType })
  mealType!: MealType;

  // ── Translatable fields ────────────────────────────────────────────
  // The nutritionist writes in Greek; the backend auto-fills comment_en

  @Field(() => String)
  @Column('text')
  comment_el!: string;

  @Field(() => String)
  @Column('text')
  comment_en!: string;

  // ── Relations ──────────────────────────────────────────────────────

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.nutritionPlans)
  user!: User;

  @Field(() => NutritionistProfile)
  @ManyToOne(() => NutritionistProfile, (nutr) => nutr.nutritionPlans)
  nutritionist!: NutritionistProfile;
}
