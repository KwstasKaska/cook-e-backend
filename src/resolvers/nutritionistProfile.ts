import {
  Arg,
  Ctx,
  Field,
  InputType,
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

@InputType()
class UpdateNutritionistProfileInput {
  @Field({ nullable: true })
  bio?: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  city?: string;
}

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

  @Mutation(() => NutritionistProfile, { nullable: true })
  @UseMiddleware(isAuth, isNutr)
  async updateNutritionistProfile(
    @Arg('data') data: UpdateNutritionistProfileInput,
    @Ctx() { req }: MyContext,
  ): Promise<NutritionistProfile | null> {
    const profile = await NutritionistProfile.findOne({
      where: { user: { id: req.session.userId } },
      relations: ['user'],
    });

    if (!profile) return null;

    if (data.bio !== undefined) profile.bio = data.bio;
    if (data.phone !== undefined) profile.phone = data.phone;
    if (data.city !== undefined) profile.city = data.city;

    await profile.save();
    return profile;
  }
}
