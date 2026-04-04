import { InputType, Field, Int } from 'type-graphql';
import { DayOfWeek, MealType } from '../../entities/Nutritionist/MealScheduler';

@InputType()
export class UpdateMealSchedulerInput {
  @Field()
  id!: number;

  @Field(() => DayOfWeek, { nullable: true })
  day?: DayOfWeek;

  @Field(() => MealType, { nullable: true })
  mealType?: MealType;

  // When provided, resolver re-translates to fill comment_en
  @Field({ nullable: true })
  comment?: string;
}

@InputType()
export class DeleteMealSchedulerInput {
  @Field(() => Int)
  id!: number;
}
