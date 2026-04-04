import { Arg, Ctx, Int, Query, Resolver, UseMiddleware } from 'type-graphql';
import { NutritionistProfile } from '../entities/Nutritionist/NutritionistProfile';
import { isAuth } from '../middleware/isAuth';
import { isNutr } from '../middleware/isNutr';
import { MyContext } from '../types';

@Resolver(NutritionistProfile)
export class NutritionistProfileResolver {
  // All nutritionists — public
  @Query(() => [NutritionistProfile])
  async nutritionists(): Promise<NutritionistProfile[]> {
    return NutritionistProfile.find({
      relations: ['user'],
    });
  }

  // Single nutritionist by id — public
  @Query(() => NutritionistProfile, { nullable: true })
  async nutritionist(
    @Arg('id', () => Int) id: number,
  ): Promise<NutritionistProfile | null> {
    return NutritionistProfile.findOne({
      where: { id },
      relations: ['user', 'slots'],
    });
  }

  // The logged-in nutritionist's own profile
  @Query(() => NutritionistProfile, { nullable: true })
  @UseMiddleware(isAuth, isNutr)
  async myNutritionistProfile(
    @Ctx() { req }: MyContext,
  ): Promise<NutritionistProfile | null> {
    return NutritionistProfile.findOne({
      where: { user: { id: req.session.userId } },
      relations: ['user'],
    });
  }
}
