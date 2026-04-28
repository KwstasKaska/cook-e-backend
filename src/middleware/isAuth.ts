import { MiddlewareFn } from 'type-graphql';
import { MyContext } from '../types';

//middleware που χρησιμοποιώ για να προστατεύω τους resolvers και να φορτώνω errors αν δεν υπαρχει ενεργό session. αντίστοιχη λογική ακολουθώ και στα άλλα τρια, για τις τρεις οντότητες ξεχωριστά
export const isAuth: MiddlewareFn<MyContext> = async ({ context }, next) => {
  if (!context.req.session.userId) {
    throw new Error('not authenticated');
  }
  return next();
};
