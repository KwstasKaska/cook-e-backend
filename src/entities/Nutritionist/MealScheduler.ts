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

registerEnumType(DayOfWeek, {
  name: 'DayOfWeek',
});

registerEnumType(MealType, {
  name: 'MealType',
});

// Creating the entity of meal scheduler and defining the proper columns so they can be created in the table in my database and also define them with typegraphql so i can get the graphql schema
// @Columns is for the database
// @Fields is for the typegraphql
// If i dont use a field operator that means that i want to hide the property from the data model

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

  @Field(() => String)
  @Column('text')
  comment!: string;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.nutritionPlans)
  user!: User;

  @Field(() => NutritionistProfile)
  @ManyToOne(() => NutritionistProfile, (nutr) => nutr.nutritionPlans)
  nutritionist!: NutritionistProfile;
}
