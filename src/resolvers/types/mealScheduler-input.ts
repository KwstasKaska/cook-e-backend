import { InputType, Field, Int } from 'type-graphql';
import { DayOfWeek, MealType } from '../../entities/Nutritionist/MealScheduler';

@InputType()
export class UpdateMealSchedulerInput {
  @Field()
  id!: number; // το primary key του meal scheduler που θέλουμε να αλλάξουμε

  @Field(() => DayOfWeek, { nullable: true })
  day?: DayOfWeek;

  @Field(() => MealType, { nullable: true })
  mealType?: MealType;

  @Field({ nullable: true })
  comment?: string;
}

@InputType()
export class DeleteMealSchedulerInput {
  @Field(() => Int)
  id!: number;
}
