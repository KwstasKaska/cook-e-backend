import {
  Arg,
  Ctx,
  Int,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from 'type-graphql';
import { NutritionistProfile } from '../entities/Nutritionist/NutritionistProfile';
import { isAuth } from '../middleware/isAuth';
import { isNutr } from '../middleware/isNutr';
import { MyContext } from '../types';
import { UpdateNutritionistProfileInput } from './types/update-nutritionist-profile-input';
import { NutritionistProfileResponse } from './types/nutritionist-profile-object';

@Resolver(NutritionistProfile)
export class NutritionistProfileResolver {
  // All nutritionists — public
  @Query(() => [NutritionistProfile])
  async nutritionists(
    @Arg('limit', () => Int, { defaultValue: 10 }) limit: number,
    @Arg('offset', () => Int, { defaultValue: 0 }) offset: number,
  ): Promise<NutritionistProfile[]> {
    return NutritionistProfile.find({
      relations: ['user'],
      take: Math.min(limit, 50),
      skip: offset,
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

  @Mutation(() => NutritionistProfileResponse)
  @UseMiddleware(isAuth, isNutr)
  async updateNutritionistProfile(
    @Arg('data') data: UpdateNutritionistProfileInput,
    @Ctx() { req }: MyContext,
  ): Promise<NutritionistProfileResponse> {
    const profile = await NutritionistProfile.findOne({
      where: { user: { id: req.session.userId } },
      relations: ['user'],
    });

    if (!profile) {
      return {
        errors: [{ field: 'profile', message: 'Το προφίλ δεν βρέθηκε.' }],
      };
    }

    if (data.bio !== undefined) profile.bio = data.bio;
    if (data.phone !== undefined) profile.phone = data.phone;
    if (data.city !== undefined) profile.city = data.city;

    try {
      const nutritionistProfile = await profile.save();
      return { nutritionistProfile };
    } catch {
      return {
        errors: [
          { field: 'server', message: 'Κάτι πήγε λάθος κατά την αποθήκευση.' },
        ],
      };
    }
  }
}
