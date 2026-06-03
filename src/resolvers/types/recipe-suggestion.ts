import { Field, Int, ObjectType } from 'type-graphql';
import { Recipe } from '../../entities/Chef/Recipe';
import { Ingredient } from '../../entities/Chef/Ingredient';
import { Utensil } from '../../entities/Chef/Utensil';

@ObjectType()
export class RecipeSuggestion {
  @Field(() => Recipe)
  recipe: Recipe;

  @Field(() => Int)
  matchCount: number;

  @Field(() => [Ingredient])
  matchedIngredients: Ingredient[];

  @Field(() => [Utensil])
  missingUtensils: Utensil[];
}
