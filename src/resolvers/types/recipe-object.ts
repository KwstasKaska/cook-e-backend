import { Field, ObjectType } from 'type-graphql';
import { Recipe } from '../../entities/Chef/Recipe';
import { FieldError } from './field-error';

@ObjectType()
export class RecipeResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => Recipe, { nullable: true })
  recipe?: Recipe;
}
