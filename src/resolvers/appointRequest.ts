import {
  Mutation,
  UseMiddleware,
  Arg,
  Ctx,
  Int,
  Resolver,
  Query,
} from 'type-graphql';
import { Appointment } from '../entities/Nutritionist/Appointment';
import { AppointmentRequest } from '../entities/Nutritionist/AppointmentRequest';
import { NutritionistProfile } from '../entities/Nutritionist/NutritionistProfile';
import { isAuth } from '../middleware/isAuth';
import { MyContext } from '../types';
import { AppointmentRequestInput } from './types/request-input';
import { AppointmentRequestResponse } from './types/request-object';
import { AppointmentStatus } from '../entities/Nutritionist/AppointmentRequest';
import { isUser } from '../middleware/isUser';
import { isNutr } from '../middleware/isNutr';

// ── Helper ────────────────────────────────────────────────────────────────────
// appointment.nutritionistId stores NutritionistProfile.id, NOT User.id.
async function resolveProfileId(
  userId: number | undefined,
): Promise<number | null> {
  if (!userId) return null;
  const profile = await NutritionistProfile.findOne({
    where: { user: { id: userId } },
  });
  return profile?.id ?? null;
}

@Resolver()
export class AppointmentRequestResolver {
  // ── User mutations ────────────────────────────────────────────────────────

  @Mutation(() => AppointmentRequestResponse)
  @UseMiddleware(isAuth, isUser)
  async requestAppointment(
    @Arg('data') data: AppointmentRequestInput,
    @Ctx() { req }: MyContext,
  ): Promise<AppointmentRequestResponse> {
    const slot = await Appointment.findOne({
      where: { id: data.slotId, isAvailable: true },
    });

    if (!slot) {
      return {
        errors: [
          {
            field: 'slotId',
            message: 'Η συγκεκριμένη ώρα δεν είναι διαθέσιμη ή δεν υπάρχει.',
          },
        ],
      };
    }

    const existingRequest = await AppointmentRequest.findOne({
      where: { slotId: data.slotId, clientId: req.session.userId },
    });

    if (existingRequest) {
      return {
        errors: [
          {
            field: 'slotId',
            message: 'Έχετε ήδη κάνει αίτηση για αυτήν την ώρα.',
          },
        ],
      };
    }

    const appointmentRequest = AppointmentRequest.create({
      slotId: data.slotId,
      clientId: req.session.userId,
      comment: data.comment,
      status: AppointmentStatus.PENDING,
    });

    try {
      await appointmentRequest.save();
    } catch (err) {
      return {
        errors: [
          {
            field: 'general',
            message: 'Κάτι πήγε λάθος κατά την αποθήκευση της αίτησης.',
          },
        ],
      };
    }

    return { appointmentRequest };
  }

  @Mutation(() => AppointmentRequestResponse, { nullable: true })
  @UseMiddleware(isAuth, isUser)
  async updateAppointmentRequest(
    @Arg('data') data: AppointmentRequestInput,
    @Ctx() { req }: MyContext,
  ): Promise<AppointmentRequestResponse | null> {
    const appointmentRequest = await AppointmentRequest.findOne({
      where: { id: data.slotId, clientId: req.session.userId },
    });

    if (!appointmentRequest) {
      return {
        errors: [{ field: 'id', message: 'Η αίτηση δεν βρέθηκε.' }],
      };
    }

    if (appointmentRequest.status !== AppointmentStatus.PENDING) {
      return {
        errors: [
          {
            field: 'status',
            message:
              'Δεν μπορείτε να τροποποιήσετε μια αίτηση που δεν είναι σε εκκρεμότητα.',
          },
        ],
      };
    }

    if (data.comment !== undefined) appointmentRequest.comment = data.comment;

    try {
      await appointmentRequest.save();
    } catch {
      return {
        errors: [
          {
            field: 'general',
            message: 'Σφάλμα κατά την ενημέρωση της αίτησης.',
          },
        ],
      };
    }

    return { appointmentRequest };
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth, isUser)
  async deleteAppointmentRequest(
    @Arg('id') id: number,
    @Ctx() { req }: MyContext,
  ): Promise<boolean> {
    const appointmentRequest = await AppointmentRequest.findOne({
      where: { id, clientId: req.session.userId },
    });

    if (!appointmentRequest) return false;

    if (appointmentRequest.status !== AppointmentStatus.PENDING) return false;

    try {
      await AppointmentRequest.remove(appointmentRequest);
      return true;
    } catch {
      return false;
    }
  }

  // ── Nutritionist mutations ─────────────────────────────────────────────────

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth, isNutr)
  async respondToAppointmentRequest(
    @Arg('requestId') requestId: number,
    @Arg('status', () => AppointmentStatus) status: AppointmentStatus,
    @Ctx() { req }: MyContext,
  ): Promise<boolean> {
    // Resolve profile id so we can verify slot ownership correctly
    const profileId = await resolveProfileId(req.session.userId);
    if (!profileId) return false;

    const request = await AppointmentRequest.createQueryBuilder('request')
      .leftJoinAndSelect('request.slot', 'slot')
      .where('request.id = :id', { id: requestId })
      .getOne();

    if (!request) return false;

    // Guard: slot must belong to this nutritionist's profile
    if (request.slot.nutritionistId !== profileId) return false;

    if (request.status !== AppointmentStatus.PENDING) return false;

    request.status = status;

    if (status === AppointmentStatus.ACCEPTED) {
      request.slot.isAvailable = false;
      await request.slot.save();
    }

    await request.save();
    return true;
  }

  // ── Nutritionist queries ───────────────────────────────────────────────────

  @Query(() => [AppointmentRequest])
  @UseMiddleware(isAuth, isNutr)
  async getAppointmentRequestsForNutritionist(
    @Ctx() { req }: MyContext,
    @Arg('limit', () => Int, { defaultValue: 20 }) limit: number,
    @Arg('offset', () => Int, { defaultValue: 0 }) offset: number,
  ): Promise<AppointmentRequest[]> {
    // Must resolve profile id — slot.nutritionistId is NutritionistProfile.id
    const profileId = await resolveProfileId(req.session.userId);
    if (!profileId) return [];

    return AppointmentRequest.createQueryBuilder('request')
      .innerJoinAndSelect('request.slot', 'slot')
      .innerJoinAndSelect('request.client', 'client')
      .where('slot.nutritionistId = :nutrId', { nutrId: profileId })
      .orderBy('request.requestedAt', 'DESC')
      .take(Math.min(limit, 100))
      .skip(offset)
      .getMany();
  }

  // ── User queries ───────────────────────────────────────────────────────────

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
}
