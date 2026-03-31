// types/MealPlanResponse.ts
import { Field, ObjectType } from 'type-graphql';
import { MealScheduler } from '../../entities/Nutritionist/MealScheduler';
import { FieldError } from './field-error';

@ObjectType()
export class MealPlanResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => MealScheduler, { nullable: true })
  mealScheduler?: MealScheduler;
}
