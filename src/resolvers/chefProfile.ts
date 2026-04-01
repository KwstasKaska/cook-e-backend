import { Arg, Ctx, Int, Query, Resolver, UseMiddleware } from 'type-graphql';
import { ChefProfile } from '../entities/Chef/ChefProfile';
import { isAuth } from '../middleware/isAuth';
import { isChef } from '../middleware/isChef';
import { MyContext } from '../types';

@Resolver(ChefProfile)
export class ChefProfileResolver {
  // All chefs — public
  @Query(() => [ChefProfile])
  async chefs(): Promise<ChefProfile[]> {
    return ChefProfile.find({
      relations: ['user'],
    });
  }

  // Single chef by id with their recipes — public
  @Query(() => ChefProfile, { nullable: true })
  async chef(@Arg('id', () => Int) id: number): Promise<ChefProfile | null> {
    return ChefProfile.findOne({
      where: { id },
      relations: ['user', 'recipes'],
    });
  }

  // The logged-in chef's own profile
  @Query(() => ChefProfile, { nullable: true })
  @UseMiddleware(isAuth, isChef)
  async myChefProfile(@Ctx() { req }: MyContext): Promise<ChefProfile | null> {
    return ChefProfile.findOne({
      where: { user: { id: req.session.userId } },
      relations: ['user'],
    });
  }
}
