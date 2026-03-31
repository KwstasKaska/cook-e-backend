import { RegisterUserInput } from '../resolvers/types/user-input';

export const validateRegister = (options: RegisterUserInput) => {
  if (options.username.length <= 2) {
    return [
      {
        field: 'username',
        message: 'Το όνομα χρήστη πρέπει να είναι παραπάνω απο δύο χαρακτήρες',
      },
    ];
  }
  if (options.username.includes('@')) {
    return [
      {
        field: 'username',
        message: 'Δεν μπορείτε να χρησιμοποιήσετε το @ για το όνομα χρήστη',
      },
    ];
  }
  if (!options.email.includes('@')) {
    return [
      {
        field: 'email',
        message: 'Πρέπει να ορίσετε ένα αληθές email',
      },
    ];
  }

  if (
    !options.password.match(/[A-Z]/) &&
    !options.password.match(/[-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]/) &&
    options.password.length <= 4
  ) {
    return [
      {
        field: 'password',
        message:
          'Ο κωδικός πρόσβασης πρέπει να περιλαμβάνει:\n\n1) Tουλάχιστον ενα κεφαλαίο γράμμα [Α-Ζ]\n\n2) Ένα ειδικό σύμβολο [- ! $ % ^ & * ( ) _ + | ~ = ` { } : " ; < > ? , .]\n\n3) Να είναι παραπάνω απο 4 χαρακτήρες.',
      },
    ];
  }

  if (!options.role) {
    return [
      {
        field: 'role',
        message: 'Πρέπει να επιλέξετε μια κατηγορία χρήστη.',
      },
    ];
  }

  return null;
};
