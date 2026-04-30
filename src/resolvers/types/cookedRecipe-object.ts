import { ObjectType, Field, Float, Int } from 'type-graphql';

@ObjectType()
export class NutritionalSummary {
  @Field(() => Float, { nullable: true })
  totalCalories?: number;

  @Field(() => Float, { nullable: true })
  totalProtein?: number;

  @Field(() => Float, { nullable: true })
  totalCarbs?: number;

  @Field(() => Float, { nullable: true })
  totalFat?: number;

  @Field(() => Int)
  cookCount: number;
}
