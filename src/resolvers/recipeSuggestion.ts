import { Arg, Int, Query, Resolver } from 'type-graphql';
import { Recipe } from '../entities/Chef/Recipe';
import { Ingredient } from '../entities/Chef/Ingredient';
import AppDataSource from '../app-data-source';
import { RecipeSuggestion } from './types/recipe-suggestion';
import { Utensil } from '../entities/Chef/Utensil';

@Resolver()
export class RecipeSuggestionResolver {
  @Query(() => [RecipeSuggestion])
  async suggestedRecipes(
    @Arg('ingredientIds', () => [Int]) ingredientIds: number[],
    @Arg('utensilIds', () => [Int], { defaultValue: [] }) utensilIds: number[],
  ): Promise<RecipeSuggestion[]> {
    if (!ingredientIds || ingredientIds.length === 0) return [];

    const rows: { recipeId: number; missing_count: number }[] =
      await AppDataSource.query(
        `
        SELECT
          ri."recipeId",
          COUNT(*) FILTER (WHERE ri."ingredientId" != ALL($1::int[]))::int AS missing_count
        FROM recipe_ingredient ri
        GROUP BY ri."recipeId"
        HAVING COUNT(*) FILTER (WHERE ri."ingredientId" = ANY($1::int[])) > 0
        ORDER BY missing_count ASC
        `,
        [ingredientIds],
      );

    if (rows.length === 0) return [];

    const suggestions: RecipeSuggestion[] = [];

    for (const row of rows) {
      const recipe = await Recipe.findOne({
        where: { id: row.recipeId },
        relations: [
          'author',
          'author.user',
          'recipeIngredients',
          'recipeIngredients.ingredient',
          'recipeIngredients.ingredient.category',
          'steps',
          'utensils',
        ],
      });

      if (!recipe) continue;

      const missingIngredients: Ingredient[] =
        row.missing_count > 0
          ? recipe.recipeIngredients
              .filter((ri) => !ingredientIds.includes(ri.ingredientId))
              .map((ri) => ri.ingredient)
          : [];

      let missingUtensils: Utensil[] = [];
      if (utensilIds.length > 0 && recipe.utensils.length > 0) {
        missingUtensils = recipe.utensils.filter(
          (u) => !utensilIds.includes(u.id),
        );
      }

      suggestions.push({
        recipe,
        missingCount: row.missing_count,
        missingIngredients,
        missingUtensils,
      });
    }

    return suggestions;
  }
}
