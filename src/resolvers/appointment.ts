import {
  Arg,
  Ctx,
  Int,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from 'type-graphql';
import { MyContext } from '../types';
import { isAuth } from '../middleware/isAuth';
import { isNutr } from '../middleware/isNutr';
import AppDataSource from '../app-data-source';
import { Appointment } from '../entities/Nutritionist/Appointment';
import {
  AppointmentRequest,
  AppointmentStatus,
} from '../entities/Nutritionist/AppointmentRequest';
import { NutritionistProfile } from '../entities/Nutritionist/NutritionistProfile';
import {
  AddAppointmentInput,
  UpdateSlotInput,
} from './types/appointment-input';
import { AppointmentResponse } from './types/appointment-object';
import { validateAppointments } from '../utils/validateAppointment';

// ── Helper ─────────────────────────────────────────────────────────────────
// appointment.nutritionistId stores NutritionistProfile.id, NOT User.id.
// Every guarded resolver must resolve the profile id first via this helper.
async function resolveProfileId(
  userId: number | undefined,
): Promise<number | null> {
  if (!userId) return null;
  const profile = await NutritionistProfile.findOne({
    where: { user: { id: userId } },
  });
  return profile?.id ?? null;
}

@Resolver(Appointment)
export class AppointmentResolver {
  // ── Queries ──────────────────────────────────────────────────────────────

  @Query(() => [Appointment])
  @UseMiddleware(isAuth, isNutr)
  async getMyAppointments(
    @Ctx() { req }: MyContext,
    @Arg('date', () => String, { nullable: true }) date?: string,
    @Arg('limit', () => Int, { defaultValue: 20 }) limit: number = 20,
    @Arg('offset', () => Int, { defaultValue: 0 }) offset: number = 0,
  ): Promise<Appointment[]> {
    const profileId = await resolveProfileId(req.session.userId);
    if (!profileId) return [];

    const safeLimit = Math.min(limit, 100);
    const query = `
      SELECT * FROM appointment
      WHERE "nutritionistId" = $1
      ${date ? `AND date = $2` : ''}
      ORDER BY date, time
      LIMIT $${date ? 3 : 2} OFFSET $${date ? 4 : 3};
    `;

    const params = date
      ? [profileId, date, safeLimit, offset]
      : [profileId, safeLimit, offset];

    return AppDataSource.query(query, params);
  }

  // Public — available slots for a given nutritionist (no auth required)
  @Query(() => [Appointment])
  async availableSlots(
    @Arg('nutritionistId', () => Int) nutritionistId: number,
  ): Promise<Appointment[]> {
    return Appointment.find({
      where: {
        nutritionistId,
        isAvailable: true,
      },
      order: { date: 'ASC', time: 'ASC' },
    });
  }

  // ── Mutations

  @Mutation(() => AppointmentResponse)
  @UseMiddleware(isAuth, isNutr)
  async createAppointment(
    @Arg('data') data: AddAppointmentInput,
    @Ctx() { req }: MyContext,
  ): Promise<AppointmentResponse> {
    const errors = validateAppointments(data);
    if (errors) return { errors };

    const profileId = await resolveProfileId(req.session.userId);
    if (!profileId) {
      return {
        errors: [
          {
            field: 'server',
            message: 'Δεν βρέθηκε προφίλ διατροφολόγου.',
          },
        ],
      };
    }

    try {
      const existing = await Appointment.findOne({
        where: {
          date: data.date,
          time: data.time,
          nutritionistId: profileId,
        },
      });

      if (existing) {
        return {
          errors: [
            {
              field: 'slot',
              message: 'Υπάρχει ήδη ραντεβού για την συγκεκριμένη ώρα.',
            },
          ],
        };
      }

      const slot = await Appointment.create({
        date: data.date,
        time: data.time,
        nutritionistId: profileId,
      }).save();

      return { slot };
    } catch (err) {
      console.error('[createAppointment] Error:', err);
      return {
        errors: [
          {
            field: 'server',
            message: 'Κάτι πήγε λάθος κατά την επιλογή ώρας.',
          },
        ],
      };
    }
  }

  @Mutation(() => AppointmentResponse, { nullable: true })
  @UseMiddleware(isAuth, isNutr)
  async updateAppointment(
    @Arg('data') data: UpdateSlotInput,
    @Ctx() { req }: MyContext,
  ): Promise<AppointmentResponse | null> {
    const profileId = await resolveProfileId(req.session.userId);
    if (!profileId) {
      return {
        errors: [
          { field: 'server', message: 'Δεν βρέθηκε προφίλ διατροφολόγου.' },
        ],
      };
    }

    const slot = await Appointment.findOne({
      where: { id: data.slotId, nutritionistId: profileId },
    });

    if (!slot) {
      return {
        errors: [{ field: 'appointment', message: 'Το ραντεβού δεν βρέθηκε.' }],
      };
    }

    const acceptedRequest = await AppointmentRequest.findOne({
      where: { slotId: slot.id, status: AppointmentStatus.ACCEPTED },
    });

    if (acceptedRequest) {
      return {
        errors: [
          {
            field: 'appointmentReserve',
            message:
              'Αυτό το ραντεβού έχει ήδη κρατηθεί και δεν μπορεί να τροποποιηθεί.',
          },
        ],
      };
    }

    if (data.date) slot.date = data.date;
    if (data.time) slot.time = data.time;
    if (typeof data.isAvailable === 'boolean')
      slot.isAvailable = data.isAvailable;

    await slot.save();
    return { slot };
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth, isNutr)
  async deleteAppointment(
    @Arg('slotId', () => Int) slotId: number,
    @Ctx() { req }: MyContext,
  ): Promise<boolean> {
    const profileId = await resolveProfileId(req.session.userId);
    if (!profileId) return false;

    const appointment = await Appointment.findOne({
      where: { id: slotId, nutritionistId: profileId },
    });

    if (!appointment) return false;

    const acceptedRequest = await AppointmentRequest.findOne({
      where: { slotId, status: AppointmentStatus.ACCEPTED },
    });

    if (acceptedRequest) return false;

    await Appointment.delete({ id: slotId });
    return true;
  }
}
