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

  @Field(() => Int)
  cookCount: number;
}

@Resolver()
export class CookedRecipeResolver {
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

  @Query(() => [CookedRecipe])
  @UseMiddleware(isAuth, isUser)
  async myCookedRecipes(
    @Ctx() { req }: MyContext,
    @Arg('limit', () => Int, { defaultValue: 10 }) limit: number,
    @Arg('offset', () => Int, { defaultValue: 0 }) offset: number,
  ): Promise<CookedRecipe[]> {
    return CookedRecipe.find({
      where: { userId: req.session.userId },
      relations: ['recipe'],
      order: { cookedAt: 'DESC' },
      take: Math.min(limit, 50),
      skip: offset,
    });
  }

  // 7-day nutritional summary — no pagination needed, it's always a single row
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
