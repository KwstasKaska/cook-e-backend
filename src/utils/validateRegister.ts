import { RegisterUserInput } from '../resolvers/types/user-input';

export const validateRegister = (options: RegisterUserInput) => {
  if (options.username.length <= 2)
    return [{ field: 'username', message: 'error.username_length' }];

  if (options.username.includes('@'))
    return [{ field: 'username', message: 'error.username_at' }];

  if (!options.email.includes('@'))
    return [{ field: 'email', message: 'error.email_invalid' }];

  if (
    !options.password.match(/[A-Z]/) ||
    !options.password.match(/[-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]/) ||
    options.password.length <= 4
  )
    return [{ field: 'password', message: 'error.password_weak' }];

  if (!options.role) return [{ field: 'role', message: 'error.role_required' }];

  return null;
};
