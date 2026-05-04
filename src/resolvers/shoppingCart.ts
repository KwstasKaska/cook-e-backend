import {
  Arg,
  Ctx,
  Int,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from 'type-graphql';
import { ShoppingCart } from '../entities/User/ShoppingCart';
import { Ingredient } from '../entities/Chef/Ingredient';
import { isAuth } from '../middleware/isAuth';
import { isUser } from '../middleware/isUser';
import { MyContext } from '../types';

@Resolver(ShoppingCart)
export class ShoppingCartResolver {
  @Query(() => [ShoppingCart])
  @UseMiddleware(isAuth, isUser)
  // Με την χρήση pagination, κάνουμε join τους πίνακες του cart με το recipe και έτσι τραβάμε τα στοιχεία που έχουμε στο καλάθι μας
  @Query(() => [ShoppingCart])
  @UseMiddleware(isAuth, isUser)
  async myCart(
    @Ctx() { req }: MyContext,
    @Arg('limit', () => Int, { defaultValue: 50 }) limit: number,
    @Arg('offset', () => Int, { defaultValue: 0 }) offset: number,
  ): Promise<ShoppingCart[]> {
    return ShoppingCart.find({
      where: { userId: req.session.userId },
      relations: ['ingredient', 'ingredient.category'],
      order: { addedAt: 'DESC' },
      take: Math.min(limit, 60),
      skip: offset,
    });
  }
  @Mutation(() => ShoppingCart)
  @UseMiddleware(isAuth, isUser)
  async addToCart(
    @Arg('ingredientId', () => Int) ingredientId: number,
    @Ctx() { req }: MyContext,
  ): Promise<ShoppingCart> {
    const ingredient = await Ingredient.findOne({
      where: { id: ingredientId },
    });
    if (!ingredient) {
      throw new Error('Το υλικό δεν βρέθηκε.');
    }

    const existing = await ShoppingCart.findOne({
      where: { userId: req.session.userId, ingredientId },
      relations: ['ingredient', 'ingredient.category'],
    });

    if (existing) return existing;

    const item = await ShoppingCart.create({
      userId: req.session.userId,
      ingredientId,
    }).save();

    return ShoppingCart.findOne({
      where: { id: item.id },
      relations: ['ingredient', 'ingredient.category'],
    }) as Promise<ShoppingCart>;
  }

  @Mutation(() => [ShoppingCart])
  @UseMiddleware(isAuth, isUser)
  async addManyToCart(
    // ουσιαστικά χρησιμοποιώ στο arg πολλά ingredientIds προκειμένου να κάνω λούπα και να κάνω έλεγχο μετά αν υπάρχει ήδη στο καλαθι, είτε αν δεν υπάρχει σαν υλικό, είτε αν θέλω να προσθέσω ενα που δεν υπάρχει, για να κάνω bulk insert υλικά στο καλάθι μου
    @Arg('ingredientIds', () => [Int]) ingredientIds: number[],
    @Ctx() { req }: MyContext,
  ): Promise<ShoppingCart[]> {
    const results: ShoppingCart[] = []; //αρχικοποιώ την λίστα μου γιατί μου έβγαζε error αν δεν την αρχικοποιούσα, οπότε ξεκινάω με κενή λίστα

    // δημιουργώ την λούπα για να κάνει τον έλεγχο για κάθε υλικό που θέλω να προσθέσω
    for (const ingredientId of ingredientIds) {
      const ingredient = await Ingredient.findOne({
        where: { id: ingredientId },
      });
      if (!ingredient) continue;

      const existing = await ShoppingCart.findOne({
        where: { userId: req.session.userId, ingredientId },
      });

      if (existing) {
        results.push(existing);
        continue;
      }

      const item = await ShoppingCart.create({
        userId: req.session.userId,
        ingredientId,
      }).save();

      results.push(item);
    }

    return results;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth, isUser)
  async removeFromCart(
    @Arg('id', () => Int) id: number,
    @Ctx() { req }: MyContext,
  ): Promise<boolean> {
    const item = await ShoppingCart.findOne({
      where: { id, userId: req.session.userId },
    });

    if (!item) return false;

    await ShoppingCart.remove(item);
    return true;
  }

  // ουσιαστικά ειναι επικίνδυνο να κάνω σκέτο delete στο production αλλά στην προκειμένη το έκανα για να διαγράφει μόνο τα δεδομένα του συγκεκριμένου χρήστη που το ζητάει
  @Mutation(() => Boolean)
  @UseMiddleware(isAuth, isUser)
  async clearCart(@Ctx() { req }: MyContext): Promise<boolean> {
    await ShoppingCart.delete({ userId: req.session.userId });
    return true;
  }
}
