import Redis from 'ioredis';

export type MyContext = {
  req: any; // express αντικείμενο για τις αιτήσεις
  res: any; // express αντικείμενο για την απαντηση του express
  redis: Redis | null; //χρησιμοποιείται για διαδικασίες όπως το forgot password
};
