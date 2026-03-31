import {
  Mutation,
  UseMiddleware,
  Arg,
  Ctx,
  Resolver,
  Query,
} from 'type-graphql';
import { Appointment } from '../entities/Nutritionist/Appointment';
import { AppointmentRequest } from '../entities/Nutritionist/AppointmentRequest';
import { isAuth } from '../middleware/isAuth';
import { MyContext } from '../types';
import { AppointmentRequestInput } from './types/request-input';
import { AppointmentRequestResponse } from './types/request-object';
import { AppointmentStatus } from '../entities/Nutritionist/AppointmentRequest';
import { isUser } from '../middleware/isUser';
import { isNutr } from '../middleware/isNutr';

@Resolver()
export class AppointmentRequestResolver {
  @Mutation(() => AppointmentRequestResponse)
  @UseMiddleware(isAuth, isUser)
  async requestAppointment(
    @Arg('data') data: AppointmentRequestInput,
    @Ctx() { req }: MyContext
  ): Promise<AppointmentRequestResponse> {
    // 1. Έλεγχος αν το slot υπάρχει και είναι διαθέσιμο
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

    // 2. Έλεγχος αν ο χρήστης έχει ήδη κάνει αίτηση για αυτό το slot
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

    // 3. Δημιουργία της αίτησης
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
    @Ctx() { req }: MyContext
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
    @Ctx() { req }: MyContext
  ): Promise<boolean> {
    const appointmentRequest = await AppointmentRequest.findOne({
      where: { id, clientId: req.session.userId },
    });

    if (!appointmentRequest) return false;

    if (appointmentRequest.status !== AppointmentStatus.PENDING) {
      return false;
    }

    try {
      await AppointmentRequest.remove(appointmentRequest);
      return true;
    } catch {
      return false;
    }
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth, isNutr) // Μόνο διατροφολόγοι
  async respondToAppointmentRequest(
    @Arg('requestId') requestId: number,
    @Arg('status', () => AppointmentStatus) status: AppointmentStatus, // accepted ή rejected
    @Ctx() { req }: MyContext
  ): Promise<boolean> {
    // Φορτώνουμε την αίτηση μαζί με το slot
    const request = await AppointmentRequest.createQueryBuilder('request')
      .leftJoinAndSelect('request.slot', 'slot')
      .where('request.id = :id', { id: requestId })
      .getOne();

    if (!request) return false;

    // Έλεγχος ότι το slot ανήκει στον τρέχοντα διατροφολόγο (μέσω nutritionistId στο slot)
    if (request.slot.nutritionistId !== req.session.userId) {
      return false;
    }

    // Ενημερώνουμε μόνο αν η αίτηση είναι σε εκκρεμότητα
    if (request.status !== AppointmentStatus.PENDING) {
      return false;
    }

    // Ενημέρωση κατάστασης αίτησης
    request.status = status;

    // Αν αποδεχτεί η αίτηση, κάνουμε το slot μη διαθέσιμο
    if (status === AppointmentStatus.ACCEPTED) {
      request.slot.isAvailable = false;
      await request.slot.save();
    }

    await request.save();

    return true;
  }

  @Query(() => [AppointmentRequest])
  @UseMiddleware(isAuth, isNutr) // Μόνο διατροφολόγοι
  async getAppointmentRequestsForNutritionist(
    @Ctx() { req }: MyContext
  ): Promise<AppointmentRequest[]> {
    const requests = await AppointmentRequest.createQueryBuilder('request')
      .innerJoinAndSelect('request.slot', 'slot')
      .innerJoinAndSelect('request.client', 'client')
      .where('slot.nutritionistId = :nutrId', { nutrId: req.session.userId })
      .orderBy('request.requestedAt', 'DESC')
      .getMany();

    return requests;
  }
}
