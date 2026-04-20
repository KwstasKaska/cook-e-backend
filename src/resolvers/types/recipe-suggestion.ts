import { Field, Int, ObjectType } from 'type-graphql';
import { Recipe } from '../../entities/Chef/Recipe';
import { Ingredient } from '../../entities/Chef/Ingredient';
import { Utensil } from '../../entities/Chef/Utensil';

@ObjectType()
export class RecipeSuggestion {
  @Field(() => Recipe)
  recipe: Recipe;

  // 0 = exact ingredient match, 1-3 = near match
  @Field(() => Int)
  missingCount: number;

  // Ingredients the user doesn't have — shown so user can add to cart
  @Field(() => [Ingredient])
  missingIngredients: Ingredient[];

  // Utensils the recipe needs that the user doesn't have
  // Never blocks the suggestion — purely informational
  @Field(() => [Utensil])
  missingUtensils: Utensil[];
}
