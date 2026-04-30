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
  async myCart(
    @Ctx() { req }: MyContext,
    @Arg('limit', () => Int, { defaultValue: 50 }) limit: number,
    @Arg('offset', () => Int, { defaultValue: 0 }) offset: number,
  ): Promise<ShoppingCart[]> {
    return ShoppingCart.find({
      where: { userId: req.session.userId },
      relations: ['ingredient', 'ingredient.category'],
      order: { addedAt: 'DESC' },
      take: Math.min(limit, 100),
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
    });

    if (existing) {
      return existing.save();
    }

    return ShoppingCart.create({
      userId: req.session.userId,
      ingredientId,
    }).save();
  }

  @Mutation(() => [ShoppingCart])
  @UseMiddleware(isAuth, isUser)
  async addManyToCart(
    @Arg('ingredientIds', () => [Int]) ingredientIds: number[],
    @Ctx() { req }: MyContext,
  ): Promise<ShoppingCart[]> {
    const results: ShoppingCart[] = [];

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

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth, isUser)
  async clearCart(@Ctx() { req }: MyContext): Promise<boolean> {
    await ShoppingCart.delete({ userId: req.session.userId });
    return true;
  }
}
