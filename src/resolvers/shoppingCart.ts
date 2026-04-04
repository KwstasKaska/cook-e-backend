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
  // ── Queries ────────────────────────────────────────────────────────

  @Query(() => [ShoppingCart])
  @UseMiddleware(isAuth, isUser)
  async myCart(@Ctx() { req }: MyContext): Promise<ShoppingCart[]> {
    return ShoppingCart.find({
      where: { userId: req.session.userId },
      relations: ['ingredient', 'ingredient.category'],
      order: { addedAt: 'DESC' },
    });
  }

  // ── Mutations ──────────────────────────────────────────────────────

  // Add a single ingredient to the cart (from predefined list or from a recipe)
  @Mutation(() => ShoppingCart)
  @UseMiddleware(isAuth, isUser)
  async addToCart(
    @Arg('ingredientId', () => Int) ingredientId: number,
    @Arg('quantity', () => String, { nullable: true }) quantity: string,
    @Arg('unit', () => String, { nullable: true }) unit: string,
    @Arg('note', () => String, { nullable: true }) note: string,
    @Ctx() { req }: MyContext,
  ): Promise<ShoppingCart> {
    const ingredient = await Ingredient.findOne({
      where: { id: ingredientId },
    });
    if (!ingredient) {
      throw new Error('Το υλικό δεν βρέθηκε.');
    }

    // If already in cart, update quantity/unit/note instead of duplicating
    const existing = await ShoppingCart.findOne({
      where: { userId: req.session.userId, ingredientId },
    });

    if (existing) {
      if (quantity !== undefined) existing.quantity = quantity;
      if (unit !== undefined) existing.unit = unit;
      if (note !== undefined) existing.note = note;
      return existing.save();
    }

    return ShoppingCart.create({
      userId: req.session.userId,
      ingredientId,
      quantity,
      unit,
      note,
    }).save();
  }

  // Add multiple ingredients at once — used when user picks missing
  // ingredients from a recipe's ingredient list
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
      if (!ingredient) continue; // skip invalid ids silently

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

  // Update quantity/unit/note on an existing cart item
  @Mutation(() => ShoppingCart)
  @UseMiddleware(isAuth, isUser)
  async updateCartItem(
    @Arg('id', () => Int) id: number,
    @Arg('quantity', () => String, { nullable: true }) quantity: string,
    @Arg('unit', () => String, { nullable: true }) unit: string,
    @Arg('note', () => String, { nullable: true }) note: string,
    @Ctx() { req }: MyContext,
  ): Promise<ShoppingCart> {
    const item = await ShoppingCart.findOne({
      where: { id, userId: req.session.userId },
    });

    if (!item) {
      throw new Error('Το αντικείμενο δεν βρέθηκε στο καλάθι.');
    }

    if (quantity !== undefined) item.quantity = quantity;
    if (unit !== undefined) item.unit = unit;
    if (note !== undefined) item.note = note;

    return item.save();
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
