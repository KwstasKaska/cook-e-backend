import {
  Arg,
  Ctx,
  Int,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from 'type-graphql';
import { ChefProfile } from '../entities/Chef/ChefProfile';
import { isAuth } from '../middleware/isAuth';
import { isChef } from '../middleware/isChef';
import { MyContext } from '../types';
import { UpdateChefProfileInput } from './types/update-chef-profile-input';
import { ChefProfileResponse } from './types/chef-profile-object';

@Resolver(ChefProfile)
export class ChefProfileResolver {
  @Query(() => [ChefProfile])
  async chefs(
    @Arg('limit', () => Int, { defaultValue: 10 }) limit: number,
    @Arg('offset', () => Int, { defaultValue: 0 }) offset: number,
  ): Promise<ChefProfile[]> {
    return ChefProfile.find({
      relations: ['user'],
      take: Math.min(limit, 50),
      skip: offset,
    });
  }

  @Query(() => ChefProfile, { nullable: true })
  async chef(@Arg('id', () => Int) id: number): Promise<ChefProfile | null> {
    return ChefProfile.findOne({
      where: { id },
      relations: ['user', 'recipes'],
    });
  }

  @Query(() => ChefProfile, { nullable: true })
  @UseMiddleware(isAuth, isChef)
  async myChefProfile(@Ctx() { req }: MyContext): Promise<ChefProfile | null> {
    return ChefProfile.findOne({
      where: { user: { id: req.session.userId } },
      relations: ['user'],
    });
  }

  @Mutation(() => ChefProfileResponse)
  @UseMiddleware(isAuth, isChef)
  async updateChefProfile(
    @Arg('data') data: UpdateChefProfileInput,
    @Ctx() { req }: MyContext,
  ): Promise<ChefProfileResponse> {
    const profile = await ChefProfile.findOne({
      where: { user: { id: req.session.userId } },
      relations: ['user'],
    });

    if (!profile) {
      return {
        errors: [{ field: 'profile', message: 'Το προφίλ δεν βρέθηκε.' }],
      };
    }

    if (data.bio !== undefined) profile.bio = data.bio;

    try {
      const chefProfile = await profile.save();
      return { chefProfile };
    } catch {
      return {
        errors: [
          { field: 'server', message: 'Κάτι πήγε λάθος κατά την αποθήκευση.' },
        ],
      };
    }
  }
}
