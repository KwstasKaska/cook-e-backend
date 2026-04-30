import {
  Arg,
  Ctx,
  Int,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from 'type-graphql';
import { UserFavorite } from '../entities/User/UserFavorite';
import { Recipe } from '../entities/Chef/Recipe';
import { isAuth } from '../middleware/isAuth';
import { isUser } from '../middleware/isUser';
import { MyContext } from '../types';

@Resolver(UserFavorite)
export class FavoritesResolver {
  //για να επιστρέψει την λίστα από UserFavorties objects
  @Query(() => [UserFavorite])
  // κάνουμε τους ελέγχους για να πρέπει να είναι user και authenticated
  @UseMiddleware(isAuth, isUser)
  async myFavorites(
    @Ctx() { req }: MyContext,
    // το limit/take χρησιμοποιείται για να δείξουμε πόσα θέλουμε
    @Arg('limit', () => Int, { defaultValue: 10 }) limit: number,
    // το offset/skip για να δείξουμε πόασ θέλουμε να παραλέιψουμε
    @Arg('offset', () => Int, { defaultValue: 0 }) offset: number,
  ): Promise<UserFavorite[]> {
    return UserFavorite.find({
      where: { userId: req.session.userId },
      relations: [
        'recipe',
        'recipe.author',
        'recipe.author.user',
        'recipe.recipeIngredients',
        'recipe.recipeIngredients.ingredient',
      ],
      order: { savedAt: 'DESC' },
      take: Math.min(limit, 50), //για safety issues, προκειμένου να υπάρχει ένα μέγιστος αριθμός που μπορεί να ζητήσει
      skip: offset,
    });
  }

  @Mutation(() => UserFavorite)
  @UseMiddleware(isAuth, isUser)
  async saveRecipe(
    @Arg('recipeId', () => Int) recipeId: number,
    @Ctx() { req }: MyContext,
  ): Promise<UserFavorite> {
    const recipe = await Recipe.findOne({ where: { id: recipeId } });
    if (!recipe) {
      throw new Error('Η συνταγή δεν βρέθηκε.');
    }

    const existing = await UserFavorite.findOne({
      where: { userId: req.session.userId, recipeId },
    });

    if (existing) return existing;

    return UserFavorite.create({
      userId: req.session.userId,
      recipeId,
    }).save();
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth, isUser)
  async unsaveRecipe(
    @Arg('recipeId', () => Int) recipeId: number,
    @Ctx() { req }: MyContext,
  ): Promise<boolean> {
    const favorite = await UserFavorite.findOne({
      where: { userId: req.session.userId, recipeId },
    });

    if (!favorite) return false;

    await UserFavorite.remove(favorite);
    return true;
  }

  @Query(() => Boolean)
  @UseMiddleware(isAuth, isUser)
  async isFavorited(
    @Arg('recipeId', () => Int) recipeId: number,
    @Ctx() { req }: MyContext,
  ): Promise<boolean> {
    const favorite = await UserFavorite.findOne({
      where: { userId: req.session.userId, recipeId },
    });
    return !!favorite;
  }
}
