import { AddAppointmentInput } from '../resolvers/types/appointment-input';

export const validateAppointments = (data: AddAppointmentInput) => {
  if (!data.date) {
    return [
      {
        field: 'date',
        message: 'Eισάγετε ημερομηνία για το ραντεβού σας',
      },
    ];
  }
  if (!data.time) {
    return [
      {
        field: 'time',
        message: 'Eισάγετε ώρα για το ραντεβού σας',
      },
    ];
  }

  return null;
};
