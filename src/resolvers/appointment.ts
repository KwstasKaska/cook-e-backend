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
import {
  AddAppointmentInput,
  UpdateSlotInput,
} from './types/appointment-input';
import { AppointmentResponse } from './types/appointment-object';
import { validateAppointments } from '../utils/validateAppointment';

@Resolver(Appointment)
export class AppointmentResolver {
  @Query(() => [Appointment])
  @UseMiddleware(isAuth, isNutr)
  async getMyAppointments(
    @Ctx() { req }: MyContext,
    @Arg('date', () => String, { nullable: true }) date?: string,
  ): Promise<Appointment[]> {
    const query = `
        SELECT * FROM appointment
        WHERE "nutritionistId" = $1
        ${date ? `AND date = $2` : ''}
        ORDER BY date, time;
      `;

    const params = date ? [req.session.userId, date] : [req.session.userId];
    const slots = await AppDataSource.query(query, params);
    return slots;
  }

  // Public — available slots for a given nutritionist
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

  @Mutation(() => AppointmentResponse)
  @UseMiddleware(isAuth, isNutr)
  async createAppointment(
    @Arg('data') data: AddAppointmentInput,
    @Ctx() { req }: MyContext,
  ): Promise<AppointmentResponse> {
    const errors = validateAppointments(data);
    if (errors) {
      return { errors };
    }

    try {
      const existing = await Appointment.findOne({
        where: {
          date: data.date,
          time: data.time,
          nutritionistId: req.session.userId,
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
        nutritionistId: req.session.userId,
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
    const slot = await Appointment.findOne({
      where: {
        id: data.slotId,
        nutritionistId: req.session.userId,
      },
    });

    if (!slot) {
      return {
        errors: [
          {
            field: 'appointment',
            message: 'Το ραντεβού δεν βρέθηκε.',
          },
        ],
      };
    }

    // ── Booking check ────────────────────────────────────────────────
    // Old code checked slot.nutritionistProfile which was unreliable.
    // Correctly check whether an ACCEPTED AppointmentRequest exists
    // for this slot — if so, it's booked and cannot be modified.
    const acceptedRequest = await AppointmentRequest.findOne({
      where: {
        slotId: slot.id,
        status: AppointmentStatus.ACCEPTED,
      },
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
    // ────────────────────────────────────────────────────────────────

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
    const appointment = await Appointment.findOne({
      where: {
        id: slotId,
        nutritionistId: req.session.userId,
      },
    });

    if (!appointment) return false;

    // Also block deletion if the slot has an accepted request
    const acceptedRequest = await AppointmentRequest.findOne({
      where: {
        slotId,
        status: AppointmentStatus.ACCEPTED,
      },
    });

    if (acceptedRequest) return false;

    await Appointment.delete({ id: slotId });
    return true;
  }
}
