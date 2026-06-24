import {
  Arg,
  Ctx,
  FieldResolver,
  Int,
  Mutation,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from 'type-graphql';
import { RegisterUserInput } from './types/user-input';
import argon2 from 'argon2';
import AppDataSource from '../app-data-source';
import { User } from '../entities/User/User';
import { UserResponse } from './types/user-object';
import { validateRegister } from '../utils/validateRegister';
import { MyContext } from '../types';
import { COOKIE_NAME } from '../constants';
import { AppointmentRequest } from '../entities/Nutritionist/AppointmentRequest';
import { isAuth } from '../middleware/isAuth';
import { isUser } from '../middleware/isUser';
import { NutritionistProfile } from '../entities/Nutritionist/NutritionistProfile';
import { MealScheduler } from '../entities/Nutritionist/MealScheduler';
import { ChefProfile } from '../entities/Chef/ChefProfile';
import { UpdateUserInput } from './types/update-user-input';
import { Conversation } from '../entities/Messsaging/Conversation';
import { Recipe } from '../entities/Chef/Recipe';
import { UserRole } from '../entities/General/Information';

@Resolver(User)
export class UserResolver {
  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() { req }: MyContext) {
    if (req.session.userId === user.id) {
      return user.email;
    }
    return '';
  }

  @Query(() => [User])
  @UseMiddleware(isAuth)
  async users(
    @Arg('limit', () => Int, { defaultValue: 20 }) limit: number,
    @Arg('offset', () => Int, { defaultValue: 0 }) offset: number,
  ): Promise<User[]> {
    return User.find({
      where: { role: UserRole.USER },
      order: { username: 'ASC' },
      take: Math.min(limit, 50),
      skip: offset,
    });
  }

  @Query(() => User, { nullable: true })
  async me(@Ctx() { req }: MyContext) {
    if (!req.session.userId) {
      return null;
    }

    const user = await User.findOne({ where: { id: req.session.userId } });
    return user;
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg('options') options: RegisterUserInput,
  ): Promise<UserResponse> {
    const errors = validateRegister(options);
    if (errors) {
      return { errors };
    }
    const hashedPassword = await argon2.hash(options.password);
    let user;

    try {
      const result = await AppDataSource.createQueryBuilder()
        .insert()
        .into(User)
        .values({
          username: options.username,
          email: options.email,
          password: hashedPassword,
          role: options.role,
        })
        .returning('*')
        .execute();

      user = result.raw[0];
      if (user.role === 'nutritionist') {
        await NutritionistProfile.create({
          user: { id: user.id } as User,
        }).save();
      }
      if (user.role === 'chef') {
        await ChefProfile.create({
          user: { id: user.id } as User,
        }).save();
      }
    } catch (err: any) {
      if (err.code === '23505') {
        if (err.constraint === 'UQ_78a916df40e02a9deb1c4b75edb')
          return {
            errors: [{ field: 'username', message: 'error.username_taken' }],
          };

        if (err.constraint === 'UQ_e12875dfb3b1d92d7d7c5377e22')
          return { errors: [{ field: 'email', message: 'error.email_taken' }] };
      }
    }

    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg('email') email: string,
    @Arg('password') password: string,
    @Ctx() { req }: MyContext,
  ): Promise<UserResponse> {
    if (!email)
      return { errors: [{ field: 'email', message: 'error.email_required' }] };

    if (!password)
      return {
        errors: [{ field: 'password', message: 'error.password_required' }],
      };

    const user = await User.findOne({ where: { email } });
    if (!user)
      return { errors: [{ field: 'email', message: 'error.email_not_found' }] };

    const valid = await argon2.verify(user.password, password);
    if (!valid)
      return {
        errors: [{ field: 'password', message: 'error.wrong_password' }],
      };

    req.session.userId = user.id;
    req.session.userRole = user.role;

    return { user } as any;
  }

  @Mutation(() => Boolean)
  async logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session.destroy((err: any) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          console.log(err);
          resolve(false);
          return;
        }
        resolve(true);
      }),
    );
  }

  @Query(() => [AppointmentRequest])
  @UseMiddleware(isAuth, isUser)
  async myAppointmentRequests(
    @Ctx() { req }: MyContext,
  ): Promise<AppointmentRequest[]> {
    return AppointmentRequest.createQueryBuilder('request')
      .leftJoinAndSelect('request.slot', 'slot')
      .leftJoinAndSelect('slot.nutritionistProfile', 'profile')
      .leftJoinAndSelect('profile.user', 'nutrUser')
      .where('request.clientId = :userId', { userId: req.session.userId })
      .orderBy('request.requestedAt', 'DESC')
      .getMany();
  }

  @Query(() => [MealScheduler])
  @UseMiddleware(isAuth, isUser)
  async myNutritionPlans(@Ctx() { req }: MyContext): Promise<MealScheduler[]> {
    return MealScheduler.find({
      where: { user: { id: req.session.userId } },
      relations: ['nutritionist', 'nutritionist.user'],
      order: { day: 'ASC', mealType: 'ASC' },
    });
  }

  @Mutation(() => UserResponse)
  @UseMiddleware(isAuth)
  async updateUser(
    @Arg('data') data: UpdateUserInput,
    @Ctx() { req }: MyContext,
  ): Promise<UserResponse> {
    const user = await User.findOne({ where: { id: req.session.userId } });
    if (!user) {
      return { errors: [{ field: 'user', message: 'error.user_not_found' }] };
    }

    if (data.newPassword) {
      if (!data.currentPassword) {
        return {
          errors: [
            {
              field: 'currentPassword',
              message: 'error.current_password_required',
            },
          ],
        };
      }
      const valid = await argon2.verify(user.password, data.currentPassword);
      if (!valid) {
        return {
          errors: [
            {
              field: 'currentPassword',
              message: 'error.current_password_wrong',
            },
          ],
        };
      }
      user.password = await argon2.hash(data.newPassword);
    }

    if (data.username) user.username = data.username;
    if (data.email) user.email = data.email;
    if (data.phoneNumber) user.phoneNumber = data.phoneNumber;
    if (data.image) user.image = data.image;

    try {
      await user.save();
    } catch (err: any) {
      if (err.code === '23505') {
        if (err.constraint === 'UQ_78a916df40e02a9deb1c4b75edb') {
          return {
            errors: [{ field: 'username', message: 'error.username_taken' }],
          };
        }
      }
    }

    return { user };
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deleteUser(@Ctx() { req, res }: MyContext): Promise<boolean> {
    const userId = req.session.userId;
    if (!userId) return false;

    const user = await User.findOne({ where: { id: userId } });
    if (!user) return false;

    await AppDataSource.transaction(async (manager) => {
      const convos = await manager.find(Conversation, {
        where: [{ participant1Id: userId }, { participant2Id: userId }],
      });
      await manager.query(`DELETE FROM message WHERE "senderId" = $1`, [
        userId,
      ]);

      if (convos.length > 0) {
        const convoIds = convos.map((c) => c.id);
        await manager.query(
          `DELETE FROM message WHERE "conversationId" = ANY($1)`,
          [convoIds],
        );
        await manager.query(`DELETE FROM conversation WHERE id = ANY($1)`, [
          convoIds,
        ]);
      }

      await manager.query(`DELETE FROM shopping_cart WHERE "userId" = $1`, [
        userId,
      ]);
      await manager.query(`DELETE FROM user_favorite WHERE "userId" = $1`, [
        userId,
      ]);
      await manager.query(`DELETE FROM cooked_recipe WHERE "userId" = $1`, [
        userId,
      ]);
      await manager.query(`DELETE FROM chef_rating WHERE "userId" = $1`, [
        userId,
      ]);
      await manager.query(`DELETE FROM recipe_rating WHERE "userId" = $1`, [
        userId,
      ]);
      await manager.query(
        `DELETE FROM appointment_request WHERE "clientId" = $1`,
        [userId],
      );
      await manager.query(`DELETE FROM meal_scheduler WHERE "userId" = $1`, [
        userId,
      ]);
      await manager.query(`DELETE FROM article WHERE "creatorId" = $1`, [
        userId,
      ]);

      const chefProfile = await manager.findOne(ChefProfile, {
        where: { user: { id: userId } },
      });
      if (chefProfile) {
        const recipes = await manager.find(Recipe, {
          where: { authorId: chefProfile.id },
        });
        for (const recipe of recipes) {
          await manager.query(
            `DELETE FROM recipe_ingredient WHERE "recipeId" = $1`,
            [recipe.id],
          );
          await manager.query(`DELETE FROM recipe_step WHERE "recipeId" = $1`, [
            recipe.id,
          ]);
          await manager.query(
            `DELETE FROM recipe_rating WHERE "recipeId" = $1`,
            [recipe.id],
          );
          await manager.query(
            `DELETE FROM user_favorite WHERE "recipeId" = $1`,
            [recipe.id],
          );
          await manager.query(
            `DELETE FROM cooked_recipe WHERE "recipeId" = $1`,
            [recipe.id],
          );
        }
        await manager.query(`DELETE FROM recipe WHERE "authorId" = $1`, [
          chefProfile.id,
        ]);
        await manager.query(`DELETE FROM chef_rating WHERE "chefId" = $1`, [
          chefProfile.id,
        ]);
        await manager.delete(ChefProfile, { id: chefProfile.id });
      }

      const nutrProfile = await manager.findOne(NutritionistProfile, {
        where: { user: { id: userId } },
      });
      if (nutrProfile) {
        await manager.query(
          `DELETE FROM meal_scheduler WHERE "nutritionistId" = $1`,
          [nutrProfile.id],
        );
        await manager.query(
          `DELETE FROM appointment_request WHERE "slotId" IN (
            SELECT id FROM appointment WHERE "nutritionistId" = $1
          )`,
          [nutrProfile.id],
        );
        await manager.query(
          `DELETE FROM appointment WHERE "nutritionistId" = $1`,
          [nutrProfile.id],
        );
        await manager.delete(NutritionistProfile, { id: nutrProfile.id });
      }

      await manager.delete(User, { id: userId });
    });

    await new Promise<void>((resolve) =>
      req.session.destroy(() => {
        res.clearCookie(COOKIE_NAME);
        resolve();
      }),
    );

    return true;
  }
}
