import { Request, Response } from 'express';
import Redis from 'ioredis';

export type MyContext = {
  req: Request;
  redis: Redis | null;
  res: Response;
};
