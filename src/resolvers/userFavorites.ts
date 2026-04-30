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
      // για να γίνονται JOIN οι πίνακες.
      relations: ['recipe', 'recipe.author', 'recipe.author.user'],
      order: { savedAt: 'DESC' },
      take: Math.min(limit, 50), //για safety issues, προκειμένου να υπάρχει ένα μέγιστος αριθμός που μπορεί να ζητήσει
      skip: offset,
    });
  }

  @Mutation(() => UserFavorite)
  @UseMiddleware(isAuth, isUser)
  async saveRecipe(
    // βάζω σε argument το recipeId που θέλω να εισάγω για να αποθηκεύω την συσκεκριμένη συνταγή
    @Arg('recipeId', () => Int) recipeId: number,
    @Ctx() { req }: MyContext,
  ): Promise<UserFavorite> {
    // προκειμένου να ελέγξω αν υπάρχει συνταγή
    const recipe = await Recipe.findOne({ where: { id: recipeId } });
    if (!recipe) {
      throw new Error('Η συνταγή δεν βρέθηκε.');
    }
    // αν υπάρχει συνταγή, την αποθηκεύω και ελέγχω να μην την αποθηκεύσω δύο φορές
    const existing = await UserFavorite.findOne({
      where: { userId: req.session.userId, recipeId },
    });

    if (existing) return existing;

    // δημιουργώ και αποθηκεύω την συνταγή που θέλω να βάλω στα αγαπημένα
    return UserFavorite.create({
      userId: req.session.userId,
      recipeId,
    }).save();
  }

  // επιστρέφεται boolean αν υπάρχει ή οχι και διαγράφεται
  @Mutation(() => Boolean)
  @UseMiddleware(isAuth, isUser)
  async unsaveRecipe(
    @Arg('recipeId', () => Int) recipeId: number,
    @Ctx() { req }: MyContext,
  ): Promise<boolean> {
    const favorite = await UserFavorite.findOne({
      where: { userId: req.session.userId, recipeId },
    });
    // έλεγχος για αν υπαρχει η συνταγή
    if (!favorite) return false;
    // προκειμένου να αφαιρέσω την συνταγή απο τα αγαπημένα
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
    // με τα !! ουσιαστικά μετατρέπω το object σε boolean, αν βρεθεί η συνταγή true αλλιώς false
    return !!favorite;
  }
}
