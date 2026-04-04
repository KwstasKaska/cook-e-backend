import {
  Arg,
  Ctx,
  Field,
  Float,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  UseMiddleware,
} from 'type-graphql';
import { CookedRecipe } from '../entities/User/CookedRecipe';
import { Recipe } from '../entities/Chef/Recipe';
import { isAuth } from '../middleware/isAuth';
import { isUser } from '../middleware/isUser';
import { MyContext } from '../types';
import AppDataSource from '../app-data-source';

// ── Response type for the 7-day summary ───────────────────────────────────────

@ObjectType()
class NutritionalSummary {
  @Field(() => Float, { nullable: true })
  totalCalories?: number;

  @Field(() => Float, { nullable: true })
  totalProtein?: number;

  @Field(() => Float, { nullable: true })
  totalCarbs?: number;

  @Field(() => Float, { nullable: true })
  totalFat?: number;

  // How many cook sessions are included in this sum
  @Field(() => Int)
  cookCount: number;
}

// ── Resolver ──────────────────────────────────────────────────────────────────

@Resolver()
export class CookedRecipeResolver {
  // Log that the user cooked a recipe
  @Mutation(() => CookedRecipe)
  @UseMiddleware(isAuth, isUser)
  async logCookedRecipe(
    @Arg('recipeId', () => Int) recipeId: number,
    @Ctx() { req }: MyContext,
  ): Promise<CookedRecipe> {
    const recipe = await Recipe.findOne({ where: { id: recipeId } });
    if (!recipe) {
      throw new Error('Η συνταγή δεν βρέθηκε.');
    }

    return CookedRecipe.create({
      userId: req.session.userId,
      recipeId,
    }).save();
  }

  // Delete a specific cook log entry — in case user tapped by mistake
  @Mutation(() => Boolean)
  @UseMiddleware(isAuth, isUser)
  async deleteCookLog(
    @Arg('id', () => Int) id: number,
    @Ctx() { req }: MyContext,
  ): Promise<boolean> {
    const log = await CookedRecipe.findOne({
      where: { id, userId: req.session.userId },
    });

    if (!log) return false;

    await CookedRecipe.remove(log);
    return true;
  }

  // All cook logs for the logged-in user — full history
  @Query(() => [CookedRecipe])
  @UseMiddleware(isAuth, isUser)
  async myCookedRecipes(@Ctx() { req }: MyContext): Promise<CookedRecipe[]> {
    return CookedRecipe.find({
      where: { userId: req.session.userId },
      relations: ['recipe'],
      order: { cookedAt: 'DESC' },
    });
  }

  // 7-day nutritional summary — sums macros from all cook logs in last 7 days
  // Each log entry counts once (so cooking the same recipe twice counts double)
  @Query(() => NutritionalSummary)
  @UseMiddleware(isAuth, isUser)
  async myNutritionalSummary(
    @Ctx() { req }: MyContext,
  ): Promise<NutritionalSummary> {
    const rows = await AppDataSource.query(
      `
      SELECT
        COUNT(cr.id)::int                  AS "cookCount",
        SUM(r."caloriesTotal")::float      AS "totalCalories",
        SUM(r.protein)::float              AS "totalProtein",
        SUM(r.carbs)::float                AS "totalCarbs",
        SUM(r.fat)::float                  AS "totalFat"
      FROM cooked_recipe cr
      INNER JOIN recipe r ON r.id = cr."recipeId"
      WHERE cr."userId" = $1
        AND cr."cookedAt" >= NOW() - INTERVAL '7 days'
      `,
      [req.session.userId],
    );

    const row = rows[0];

    return {
      cookCount: row.cookCount ?? 0,
      totalCalories: row.totalCalories ?? 0,
      totalProtein: row.totalProtein ?? 0,
      totalCarbs: row.totalCarbs ?? 0,
      totalFat: row.totalFat ?? 0,
    };
  }
}
