import {
  Arg,
  Ctx,
  FieldResolver,
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
import { v4 } from 'uuid';
import { sendEmail } from '../utils/sendEmail';
import { AppointmentRequest } from '../entities/Nutritionist/AppointmentRequest';
import { isAuth } from '../middleware/isAuth';
import { isUser } from '../middleware/isUser';
import { NutritionistProfile } from '../entities/Nutritionist/NutritionistProfile';
import { MealScheduler } from '../entities/Nutritionist/MealScheduler';
import { ChefProfile } from '../entities/Chef/ChefProfile';
import { UpdateUserInput } from './types/update-user-input';
import { Conversation } from '../entities/Messsaging/Conversation';
import { Recipe } from '../entities/Chef/Recipe';

@Resolver(User)
export class UserResolver {
  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() { req }: MyContext) {
    if (req.session.userId === user.id) {
      return user.email;
    }
    return '';
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg('token') token: string,
    @Arg('newPassword') newPassword: string,
    @Ctx() { redis, req }: MyContext,
  ): Promise<UserResponse> {
    if (
      !newPassword.match(/[A-Z]/) ||
      !newPassword.match(/[-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]/) ||
      newPassword.length <= 4
    ) {
      return {
        errors: [
          {
            field: 'newPassword',
            message:
              'Ο κωδικός πρόσβασης πρέπει να περιλαμβάνει:\n\n1) Tουλάχιστον ενα κεφαλαίο γράμμα [Α-Ζ]\n\n2) Ένα ειδικό σύμβολο [- ! $ % ^ & * ( ) _ + | ~ = ` { } : " ; < > ? , .]\n\n3) Να είναι παραπάνω απο 4 χαρακτήρες.',
          },
        ],
      };
    }

    if (!redis) {
      return {
        errors: [
          { field: 'token', message: 'Η υπηρεσία δεν είναι διαθέσιμη.' },
        ],
      };
    }

    const key = 'forget-password:' + token;
    const userId = await redis.get(key);
    if (!userId) {
      return {
        errors: [
          {
            field: 'token',
            message: 'token expired',
          },
        ],
      };
    }

    const user = await User.findOne({ where: { id: userId } } as any);
    if (!user) {
      return {
        errors: [
          {
            field: 'token',
            message: 'Ο χρήστης δεν υπάρχει πια.',
          },
        ],
      };
    }

    await User.update({ id: userId } as any, {
      password: await argon2.hash(newPassword),
    });

    await redis.del(key);

    req.session.userId = user?.id;

    return { user } as any;
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg('email') email: string,
    @Ctx() { redis }: MyContext,
  ) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return true;
    }
    const token = v4();
    if (!redis) return false;
    await redis.set(
      'forget-password:' + token,
      user.id,
      'EX',
      60 * 60 * 24 * 3,
    );

    await sendEmail(
      email,
      `<a href="${process.env.FRONTEND_URL}/change-password/${token}">Επαναφορά κωδικού πρόσβασης</a>`,
    );
    return true;
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
    @Ctx() { req }: MyContext,
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
        if (err.constraint === 'UQ_78a916df40e02a9deb1c4b75edb') {
          return {
            errors: [
              {
                field: 'username',
                message: 'Το όνομα  χρησιμοποιείται από άλλον χρήστη',
              },
            ],
          };
        } else if (err.constraint === 'UQ_e12875dfb3b1d92d7d7c5377e22') {
          return {
            errors: [
              {
                field: 'email',
                message: 'Το email χρησιμοποιείται από άλλον χρήστη',
              },
            ],
          };
        }
      }
    }

    req.session.userId = user.id;
    req.session.userRole = user.role;
    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg('usernameOrEmail') usernameOrEmail: string,
    @Arg('password') password: string,
    @Ctx() { req }: MyContext,
  ): Promise<UserResponse> {
    const user = await User.findOne(
      usernameOrEmail.includes('@')
        ? { where: { email: usernameOrEmail } }
        : { where: { username: usernameOrEmail } },
    );
    if (!user) {
      return {
        errors: [
          {
            field: 'usernameOrEmail',
            message: 'Το όνομα χρήστη ή το email δεν υπάρχει',
          },
        ],
      };
    }
    const valid = await argon2.verify(user!.password, password);
    if (!valid) {
      return {
        errors: [
          {
            field: 'password',
            message: 'Λανθασμένος Κωδικός',
          },
        ],
      };
    }

    req.session.userId = user!.id;
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
    return AppointmentRequest.find({
      where: { clientId: req.session.userId },
      relations: ['slot'],
      order: { requestedAt: 'DESC' },
    });
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
      return { errors: [{ field: 'user', message: 'Ο χρήστης δεν βρέθηκε.' }] };
    }

    if (data.newPassword) {
      if (!data.currentPassword) {
        return {
          errors: [
            {
              field: 'currentPassword',
              message: 'Παρακαλώ εισάγετε τον τρέχοντα κωδικό σας.',
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
              message: 'Λανθασμένος τρέχων κωδικός.',
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
            errors: [
              {
                field: 'username',
                message: 'Το όνομα χρησιμοποιείται από άλλον χρήστη.',
              },
            ],
          };
        }
        if (err.constraint === 'UQ_e12875dfb3b1d92d7d7c5377e22') {
          return {
            errors: [
              {
                field: 'email',
                message: 'Το email χρησιμοποιείται από άλλον χρήστη.',
              },
            ],
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
        console.log('[deleteUser] nutrProfile id:', nutrProfile.id);

        await manager.query(
          `DELETE FROM meal_scheduler WHERE "nutritionistId" = $1`,
          [nutrProfile.id],
        );
        console.log('[deleteUser] meal_scheduler deleted');

        await manager.query(
          `DELETE FROM appointment_request WHERE "slotId" IN (
    SELECT id FROM appointment WHERE "nutritionistId" = $1 OR "nutritionistProfileId" = $1
  )`,
          [nutrProfile.id],
        );
        console.log('[deleteUser] appointment_request deleted');

        await manager.query(
          `DELETE FROM appointment WHERE "nutritionistId" = $1 OR "nutritionistProfileId" = $1`,
          [nutrProfile.id],
        );
        console.log('[deleteUser] appointment deleted');

        await manager.delete(NutritionistProfile, { id: nutrProfile.id });
        console.log('[deleteUser] nutrProfile deleted');
      }
      await manager.query(`DELETE FROM nutritionist WHERE "userId" = $1`, [
        userId,
      ]);
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
