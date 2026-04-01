import { Query, Resolver } from 'type-graphql';
import { Ingredient } from '../entities/Chef/Ingredient';
import { Utensil } from '../entities/Chef/Utensil';
import { IngredientsCategory } from '../entities/Chef/IngredientsCategory';

@Resolver()
export class IngredientResolver {
  // All ingredients with their category — used by chef recipe form and user filter
  @Query(() => [Ingredient])
  async ingredients(): Promise<Ingredient[]> {
    return Ingredient.find({
      relations: ['category'],
      order: { name: 'ASC' },
    });
  }

  // All ingredient categories — useful for grouping in dropdowns
  @Query(() => [IngredientsCategory])
  async ingredientCategories(): Promise<IngredientsCategory[]> {
    return IngredientsCategory.find({
      relations: ['ingredients'],
      order: { name: 'ASC' },
    });
  }
}

@Resolver()
export class UtensilResolver {
  // All utensils — used by chef recipe form and user filter
  @Query(() => [Utensil])
  async utensils(): Promise<Utensil[]> {
    return Utensil.find({
      order: { name: 'ASC' },
    });
  }
}
