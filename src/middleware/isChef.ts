import { MiddlewareFn } from 'type-graphql';
import { MyContext } from '../types';

export const isChef: MiddlewareFn<MyContext> = async ({ context }, next) => {
  const userRole = context.req.session.userRole;
  if (userRole !== 'chef') {
    throw new Error('Περιορισμός Πρόσβασης: Προσβάσιμο μόνο για μάγειρες.');
  }
  return next();
};
