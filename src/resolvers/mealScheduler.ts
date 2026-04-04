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
import { translateText } from '../utils/translate';

@Resolver()
export class NutritionPlanResolver {
  @Query(() => [MealScheduler])
  @UseMiddleware(isAuth, isNutr)
  async getNutritionistMealPlans(
    @Ctx() { req }: MyContext,
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

      // ── Approved-user guard ──────────────────────────────────────────
      // A nutritionist can only create a meal plan for a user who has
      // an accepted appointment request with them. This ensures the
      // nutritionist-user relationship is established before planning.
      const approvedRequest = await AppointmentRequest.createQueryBuilder('req')
        .innerJoin('req.slot', 'slot')
        .where('req.clientId = :userId', { userId })
        .andWhere('slot.nutritionistId = :nutrUserId', {
          nutrUserId: req.session.userId,
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
      // ────────────────────────────────────────────────────────────────

      const existing = await MealScheduler.findOne({
        where: { user: { id: userId }, day, mealType },
        relations: ['user'],
      });

      if (existing) {
        return {
          errors: [
            {
              field: 'meal',
              message: 'Υπάρχει ήδη πλάνο για αυτή τη μέρα και τύπο γεύματος.',
            },
          ],
        };
      }

      const comment_en = await translateText(comment);

      const mealScheduler = MealScheduler.create({
        user,
        nutritionist,
        day,
        mealType,
        comment_el: comment,
        comment_en,
      });

      await mealScheduler.save();

      return { mealScheduler };
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
  async UpdateMealSchedulerInput(
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
      meal.comment_el = data.comment;
      meal.comment_en = await translateText(data.comment);
    }

    await meal.save();

    return { mealScheduler: meal };
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
