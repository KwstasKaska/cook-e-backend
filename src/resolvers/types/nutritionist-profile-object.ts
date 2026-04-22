import { Field, ObjectType } from 'type-graphql';
import { NutritionistProfile } from '../../entities/Nutritionist/NutritionistProfile';
import { FieldError } from './field-error';

@ObjectType()
export class NutritionistProfileResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => NutritionistProfile, { nullable: true })
  nutritionistProfile?: NutritionistProfile;
}
