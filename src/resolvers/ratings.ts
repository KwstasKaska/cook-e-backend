import {
  Arg,
  Ctx,
  Float,
  Int,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from 'type-graphql';
import { ChefRating } from '../entities/General/ChefRating';
import { RecipeRating } from '../entities/General/RecipeRating';
import { ChefProfile } from '../entities/Chef/ChefProfile';
import { Recipe } from '../entities/Chef/Recipe';
import { isAuth } from '../middleware/isAuth';
import { isUser } from '../middleware/isUser';
import { MyContext } from '../types';
import AppDataSource from '../app-data-source';

@Resolver()
export class RatingResolver {
  // ── Chef ratings ───────────────────────────────────────────────────

  @Query(() => [ChefRating])
  async chefRatings(
    @Arg('chefId', () => Int) chefId: number,
    @Arg('limit', () => Int, { defaultValue: 10 }) limit: number,
    @Arg('offset', () => Int, { defaultValue: 0 }) offset: number,
  ): Promise<ChefRating[]> {
    return ChefRating.find({
      where: { chefId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 50),
      skip: offset,
    });
  }

  @Query(() => Float, { nullable: true })
  async chefAverageRating(
    @Arg('chefId', () => Int) chefId: number,
  ): Promise<number | null> {
    const result = await AppDataSource.query(
      `SELECT AVG(score)::float AS avg FROM chef_rating WHERE "chefId" = $1`,
      [chefId],
    );
    return result[0]?.avg ?? null;
  }

  @Mutation(() => ChefRating)
  @UseMiddleware(isAuth, isUser)
  async rateChef(
    @Arg('chefId', () => Int) chefId: number,
    @Arg('score', () => Int) score: number,
    @Arg('comment', () => String, { nullable: true }) comment: string,
    @Ctx() { req }: MyContext,
  ): Promise<ChefRating> {
    if (score < 1 || score > 5) {
      throw new Error('Η βαθμολογία πρέπει να είναι μεταξύ 1 και 5.');
    }

    const chef = await ChefProfile.findOne({ where: { id: chefId } });
    if (!chef) throw new Error('Ο μάγειρας δεν βρέθηκε.');

    const existing = await ChefRating.findOne({
      where: { userId: req.session.userId, chefId },
    });

    if (existing) {
      existing.score = score;
      if (comment !== undefined) existing.comment = comment;
      return existing.save();
    }

    return ChefRating.create({
      userId: req.session.userId,
      chefId,
      score,
      comment,
    }).save();
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth, isUser)
  async deleteChefRating(
    @Arg('chefId', () => Int) chefId: number,
    @Ctx() { req }: MyContext,
  ): Promise<boolean> {
    const rating = await ChefRating.findOne({
      where: { userId: req.session.userId, chefId },
    });

    if (!rating) return false;

    await ChefRating.remove(rating);
    return true;
  }

  @Query(() => ChefRating, { nullable: true })
  @UseMiddleware(isAuth)
  async myChefRating(
    @Arg('chefId', () => Int) chefId: number,
    @Ctx() { req }: MyContext,
  ): Promise<ChefRating | null> {
    return ChefRating.findOne({
      where: { userId: req.session.userId, chefId },
    });
  }

  // ── Recipe ratings ─────────────────────────────────────────────────

  @Query(() => [RecipeRating])
  async recipeRatings(
    @Arg('recipeId', () => Int) recipeId: number,
    @Arg('limit', () => Int, { defaultValue: 10 }) limit: number,
    @Arg('offset', () => Int, { defaultValue: 0 }) offset: number,
  ): Promise<RecipeRating[]> {
    return RecipeRating.find({
      where: { recipeId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 50),
      skip: offset,
    });
  }

  @Query(() => Float, { nullable: true })
  async recipeAverageRating(
    @Arg('recipeId', () => Int) recipeId: number,
  ): Promise<number | null> {
    const result = await AppDataSource.query(
      `SELECT AVG(score)::float AS avg FROM recipe_rating WHERE "recipeId" = $1`,
      [recipeId],
    );
    return result[0]?.avg ?? null;
  }

  @Mutation(() => RecipeRating)
  @UseMiddleware(isAuth, isUser)
  async rateRecipe(
    @Arg('recipeId', () => Int) recipeId: number,
    @Arg('score', () => Int) score: number,
    @Arg('comment', () => String, { nullable: true }) comment: string,
    @Ctx() { req }: MyContext,
  ): Promise<RecipeRating> {
    if (score < 1 || score > 5) {
      throw new Error('Η βαθμολογία πρέπει να είναι μεταξύ 1 και 5.');
    }

    const recipe = await Recipe.findOne({ where: { id: recipeId } });
    if (!recipe) throw new Error('Η συνταγή δεν βρέθηκε.');

    const existing = await RecipeRating.findOne({
      where: { userId: req.session.userId, recipeId },
    });

    if (existing) {
      existing.score = score;
      if (comment !== undefined) existing.comment = comment;
      return existing.save();
    }

    return RecipeRating.create({
      userId: req.session.userId,
      recipeId,
      score,
      comment,
    }).save();
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth, isUser)
  async deleteRecipeRating(
    @Arg('recipeId', () => Int) recipeId: number,
    @Ctx() { req }: MyContext,
  ): Promise<boolean> {
    const rating = await RecipeRating.findOne({
      where: { userId: req.session.userId, recipeId },
    });

    if (!rating) return false;

    await RecipeRating.remove(rating);
    return true;
  }

  @Query(() => RecipeRating, { nullable: true })
  @UseMiddleware(isAuth)
  async myRecipeRating(
    @Arg('recipeId', () => Int) recipeId: number,
    @Ctx() { req }: MyContext,
  ): Promise<RecipeRating | null> {
    return RecipeRating.findOne({
      where: { userId: req.session.userId, recipeId },
    });
  }
}
