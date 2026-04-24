import Redis from 'ioredis';

export type MyContext = {
  req: any;
  res: any;
  redis: Redis | null;
};
