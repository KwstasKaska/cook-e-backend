import {
  Resolver,
  Mutation,
  Arg,
  UseMiddleware,
  Ctx,
  Int,
  Query,
} from 'type-graphql';
import {
  DayOfWeek,
  MealScheduler,
  MealType,
} from '../entities/Nutritionist/MealScheduler';
import { User } from '../entities/User/User';
import { isAuth } from '../middleware/isAuth';
import { isNutr } from '../middleware/isNutr';
import { NutritionistProfile } from '../entities/Nutritionist/NutritionistProfile';
import {
  AppointmentRequest,
  AppointmentStatus,
} from '../entities/Nutritionist/AppointmentRequest';
import { MyContext } from '../types';
import { MealPlanResponse } from './types/mealScheduler-object';
import { UpdateMealSchedulerInput } from './types/mealScheduler-input';
import { translateBilingual } from '../utils/translate';
import { isUser } from '../middleware/isUser';

const loadMeal = (id: number) =>
  MealScheduler.findOne({
    where: { id },
    relations: ['user', 'nutritionist', 'nutritionist.user'],
  });

@Resolver()
export class NutritionPlanResolver {
  @Query(() => [MealScheduler])
  @UseMiddleware(isAuth, isNutr)
  async getNutritionistMealPlans(
    @Ctx() { req }: MyContext,
    @Arg('limit', () => Int, { defaultValue: 20 }) limit: number,
    @Arg('offset', () => Int, { defaultValue: 0 }) offset: number,
  ): Promise<MealScheduler[]> {
    const nutritionist = await NutritionistProfile.findOne({
      where: { user: { id: req.session.userId } },
    });

    if (!nutritionist) {
      throw new Error('Δεν βρέθηκε προφίλ διατροφολόγου.');
    }

    return MealScheduler.find({
      where: { nutritionist: { id: nutritionist.id } },
      relations: ['user', 'nutritionist'],
      order: { day: 'ASC', mealType: 'ASC' },
      take: Math.min(limit, 100),
      skip: offset,
    });
  }

  @Query(() => [MealScheduler])
  @UseMiddleware(isAuth, isUser)
  async myMealPlan(@Ctx() { req }: MyContext): Promise<MealScheduler[]> {
    return MealScheduler.find({
      where: { user: { id: req.session.userId } },
      relations: ['nutritionist', 'nutritionist.user'],
      order: { day: 'ASC', mealType: 'ASC' },
    });
  }

  @Mutation(() => MealPlanResponse)
  @UseMiddleware(isAuth, isNutr)
  async createMealScheduler(
    @Arg('userId') userId: number,
    @Arg('day', () => DayOfWeek) day: DayOfWeek,
    @Arg('mealType', () => MealType) mealType: MealType,
    @Arg('comment') comment: string,
    @Ctx() { req }: MyContext,
  ): Promise<MealPlanResponse> {
    try {
      const user = await User.findOne({ where: { id: userId } });
      if (!user) {
        return {
          errors: [{ field: 'userId', message: 'Ο χρήστης δεν βρέθηκε.' }],
        };
      }

      const nutritionist = await NutritionistProfile.findOne({
        where: { user: { id: req.session.userId } },
        relations: ['user'],
      });

      if (!nutritionist) {
        return {
          errors: [
            {
              field: 'nutritionist',
              message: 'Δεν βρέθηκε προφίλ διατροφολόγου.',
            },
          ],
        };
      }

      const approvedRequest = await AppointmentRequest.createQueryBuilder('req')
        .innerJoin('req.slot', 'slot')
        .where('req.clientId = :userId', { userId })
        .andWhere('slot.nutritionistId = :profileId', {
          profileId: nutritionist.id,
        })
        .andWhere('req.status = :status', {
          status: AppointmentStatus.ACCEPTED,
        })
        .getOne();

      if (!approvedRequest) {
        return {
          errors: [
            {
              field: 'userId',
              message:
                'Μπορείτε να δημιουργήσετε πλάνο μόνο για χρήστες με εγκεκριμένο ραντεβού.',
            },
          ],
        };
      }

      const existing = await MealScheduler.findOne({
        where: { user: { id: userId }, day, mealType },
      });

      const commentBi = await translateBilingual(comment);

      if (existing) {
        existing.comment_el = commentBi.el;
        existing.comment_en = commentBi.en;
        existing.nutritionist = nutritionist;
        await existing.save();
        return { mealScheduler: (await loadMeal(existing.id)) ?? existing };
      }

      const mealScheduler = MealScheduler.create({
        user,
        nutritionist,
        day,
        mealType,
        comment_el: commentBi.el,
        comment_en: commentBi.en,
      });

      await mealScheduler.save();

      return {
        mealScheduler: (await loadMeal(mealScheduler.id)) ?? mealScheduler,
      };
    } catch (err) {
      console.error('[createMealScheduler] Error:', err);
      return {
        errors: [
          {
            field: 'server',
            message: 'Κάτι πήγε λάθος κατά την δημιουργία του πλάνου.',
          },
        ],
      };
    }
  }

  @Mutation(() => MealPlanResponse, { nullable: true })
  @UseMiddleware(isAuth, isNutr)
  async updateMealScheduler(
    @Arg('data') data: UpdateMealSchedulerInput,
    @Ctx() { req }: MyContext,
  ): Promise<MealPlanResponse> {
    const meal = await MealScheduler.findOne({
      where: { id: data.id },
      relations: ['nutritionist', 'nutritionist.user'],
    });

    if (!meal || meal.nutritionist.user.id !== req.session.userId) {
      return {
        errors: [
          {
            field: 'id',
            message: 'Δεν βρέθηκε το γεύμα ή δεν έχετε δικαίωμα επεξεργασίας.',
          },
        ],
      };
    }

    if (data.day) meal.day = data.day;
    if (data.mealType) meal.mealType = data.mealType;

    if (data.comment !== undefined) {
      const commentBi = await translateBilingual(data.comment);
      meal.comment_el = commentBi.el;
      meal.comment_en = commentBi.en;
    }

    await meal.save();

    return { mealScheduler: (await loadMeal(meal.id)) ?? meal };
  }

  @Mutation(() => MealPlanResponse)
  @UseMiddleware(isAuth, isNutr)
  async deleteMealScheduler(
    @Arg('id', () => Int) id: number,
    @Ctx() { req }: MyContext,
  ): Promise<MealPlanResponse> {
    const meal = await MealScheduler.findOne({
      where: { id },
      relations: ['nutritionist', 'nutritionist.user'],
    });

    if (!meal || meal.nutritionist.user.id !== req.session.userId) {
      return {
        errors: [
          {
            field: 'id',
            message: 'Δεν βρέθηκε το γεύμα ή δεν έχετε δικαίωμα διαγραφής.',
          },
        ],
      };
    }

    await MealScheduler.delete({ id });

    return { mealScheduler: meal };
  }
}
