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
import { ChefProfile } from '../entities/Chef/ChefProfile';
import { isAuth } from '../middleware/isAuth';
import { isChef } from '../middleware/isChef';
import { MyContext } from '../types';

@InputType()
class UpdateChefProfileInput {
  @Field({ nullable: true })
  bio?: string;
}

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

  @Mutation(() => ChefProfile, { nullable: true })
  @UseMiddleware(isAuth, isChef)
  async updateChefProfile(
    @Arg('data') data: UpdateChefProfileInput,
    @Ctx() { req }: MyContext,
  ): Promise<ChefProfile | null> {
    const profile = await ChefProfile.findOne({
      where: { user: { id: req.session.userId } },
      relations: ['user'],
    });

    if (!profile) return null;

    if (data.bio !== undefined) profile.bio = data.bio;

    await profile.save();
    return profile;
  }
}
