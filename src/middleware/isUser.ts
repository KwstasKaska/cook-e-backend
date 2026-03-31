import { MiddlewareFn } from 'type-graphql';
import { MyContext } from '../types';

export const isUser: MiddlewareFn<MyContext> = async ({ context }, next) => {
  const userRole = context.req.session.userRole;
  if (userRole !== 'user') {
    throw new Error('Περιορισμός Πρόσβασης: Προσβάσιμο μόνο για χρήστες.');
  }
  return next();
};
