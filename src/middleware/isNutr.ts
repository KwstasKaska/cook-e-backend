import { MiddlewareFn } from 'type-graphql';
import { MyContext } from '../types';

export const isNutr: MiddlewareFn<MyContext> = async ({ context }, next) => {
  const userRole = context.req.session.userRole;
  if (userRole !== 'nutritionist') {
    throw new Error(
      'Περιορισμός Πρόσβασης: Προσβάσιμο μόνο για διατροφολόγους.'
    );
  }
  return next();
};
