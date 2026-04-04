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
// import { MyContext } from '../types';
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
import { createWriteStream } from 'fs';
import { GraphQLUpload, FileUpload } from 'graphql-upload-minimal';
import path from 'path';
import { UpdateUserInput } from './types/update-user-input';

@Resolver(User)
export class UserResolver {
  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() { req }: MyContext) {
    // This is the current user and its ok to show them their email
    if (req.session.userId === user.id) {
      return user.email;
    }
    //  current user wants to see someone elses email
    return '';
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg('token') token: string,
    @Arg('newPassword') newPassword: string,
    @Ctx() { redis, req }: MyContext,
  ): Promise<UserResponse> {
    if (
      !newPassword.match(/[A-Z]/) &&
      !newPassword.match(/[-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]/) &&
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

    // login user after change password
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
      // the email is not in the db
      return true;
    }
    const token = v4();

    await redis.set(
      'forget-password:' + token,
      user.id,
      'EX',
      60 * 60 * 24 * 3, //3 days
    );

    await sendEmail(
      email,
      `<a  href="http://localhost:3000/change-password/${token}">Επαναφορά κωδικού πρόσβασης</a>`,
    );
    return true;
  }

  @Query(() => User, { nullable: true })
  // @UseMiddleware(isRole)
  async me(@Ctx() { req }: MyContext) {
    // you are not logged in
    if (!req.session.userId) {
      console.log('Not logged');
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
        // εδώ κάνω cast το userId σε User, για να το δεχτεί το TypeORM relation
        await NutritionistProfile.create({
          user: { id: user.id } as User,
        }).save();
      }
      if (user.role === 'chef') {
        //  εδώ κάνω cast το userId σε User, για να το δεχτεί το TypeORM relation
        await ChefProfile.create({
          user: { id: user.id } as User,
        }).save();
      }
    } catch (err) {
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

    //store user id session
    // this will set a cookie on the user
    // keep them logged in
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
      req.session.destroy((err) => {
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
  @UseMiddleware(isAuth, isUser)
  async updateUser(
    @Arg('data') data: UpdateUserInput,
    @Ctx() { req }: MyContext,
  ): Promise<UserResponse> {
    const user = await User.findOne({ where: { id: req.session.userId } });
    if (!user) {
      return { errors: [{ field: 'user', message: 'Ο χρήστης δεν βρέθηκε.' }] };
    }

    // Password change — requires current password verification
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

    try {
      await user.save();
    } catch (err) {
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
  @UseMiddleware(isAuth, isUser)
  async updateUserImage(
    @Arg('picture', () => GraphQLUpload) picture: FileUpload,
    @Ctx() { req }: MyContext,
  ): Promise<boolean> {
    const user = await User.findOne({ where: { id: req.session.userId } });
    if (!user) return false;

    const { createReadStream, filename } = picture;
    const imagePath = path.join(__dirname, `../../public/images/${filename}`);

    return new Promise((resolve, reject) => {
      createReadStream()
        .pipe(createWriteStream(imagePath))
        .on('finish', async () => {
          user.image = `http://localhost:4000/images/${filename}`;
          await user.save();
          resolve(true);
        })
        .on('error', (error) => {
          console.error('Error writing file:', error);
          reject(false);
        });
    });
  }
}
