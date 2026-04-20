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
    @Arg('maxMissing', () => Int, { defaultValue: 3 }) maxMissing: number,
  ): Promise<RecipeSuggestion[]> {
    if (!ingredientIds || ingredientIds.length === 0) {
      return [];
    }

    // ── Step 1: Find qualifying recipes based on ingredients only ──────
    //
    // Utensils are intentionally NOT part of this SQL — they never
    // filter out a recipe. We compute missing utensils after the fact
    // purely for display purposes.
    //
    // Branch A: recipes missing 1–maxMissing ingredients the user lacks
    // Branch B: recipes where user has ALL ingredients (exact match, missing=0)
    // Both branches exclude recipes with no ingredients at all.

    const rows: { recipeId: number; missing_count: number }[] =
      await AppDataSource.query(
        `
        SELECT
          ri_all."recipeId",
          COUNT(*)::int AS missing_count
        FROM recipe_ingredient ri_all
        WHERE ri_all."ingredientId" NOT IN (
          SELECT unnest($1::int[])
        )
        GROUP BY ri_all."recipeId"
        HAVING COUNT(*) <= $2

        UNION ALL

        SELECT
          r.id AS "recipeId",
          0 AS missing_count
        FROM recipe r
        WHERE NOT EXISTS (
          SELECT 1
          FROM recipe_ingredient ri
          WHERE ri."recipeId" = r.id
            AND ri."ingredientId" NOT IN (
              SELECT unnest($1::int[])
            )
        )
        AND EXISTS (
          SELECT 1 FROM recipe_ingredient ri2 WHERE ri2."recipeId" = r.id
        )
        `,
        [ingredientIds, maxMissing],
      );

    if (rows.length === 0) return [];

    // ── Step 2: Deduplicate — keep lowest missing_count per recipe ─────

    const dedupedMap = new Map<number, number>();
    for (const row of rows) {
      const existing = dedupedMap.get(row.recipeId);
      if (existing === undefined || row.missing_count < existing) {
        dedupedMap.set(row.recipeId, row.missing_count);
      }
    }

    // Sort: exact matches first, then ascending by missing ingredient count
    const sorted = [...dedupedMap.entries()].sort((a, b) => a[1] - b[1]);

    // ── Step 3: Build full suggestion objects ──────────────────────────

    const suggestions: RecipeSuggestion[] = [];

    for (const [recipeId, missingCount] of sorted) {
      const recipe = await Recipe.findOne({
        where: { id: recipeId },
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

      // ── Missing ingredients ──────────────────────────────────────────
      // Which specific ingredients is the user lacking for this recipe?

      let missingIngredients: Ingredient[] = [];

      if (missingCount > 0) {
        missingIngredients = recipe.recipeIngredients
          .filter((ri) => !ingredientIds.includes(ri.ingredientId))
          .map((ri) => ri.ingredient);
      }

      // ── Missing utensils (soft — never blocks suggestion) ────────────
      // Which utensils does this recipe need that the user doesn't have?
      // If the user passed no utensilIds at all, missingUtensils is empty
      // (we treat it as "user didn't specify, assume he has what he needs")

      let missingUtensils: Utensil[] = [];

      if (utensilIds.length > 0 && recipe.utensils.length > 0) {
        missingUtensils = recipe.utensils.filter(
          (u) => !utensilIds.includes(u.id),
        );
      }

      suggestions.push({
        recipe,
        missingCount,
        missingIngredients,
        missingUtensils,
      });
    }

    return suggestions;
  }
}
