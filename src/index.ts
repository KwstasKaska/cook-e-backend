import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();
import AppDataSource from './app-data-source';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import session from 'express-session';

import Redis from 'ioredis';
import { COOKIE_NAME } from './constants';
import { MyContext } from './types';
import { buildSchema } from 'type-graphql';
import bodyParser from 'body-parser';
import { ArticleResolver } from './resolvers/article';
import { UserResolver } from './resolvers/user';
import { graphqlUploadExpress } from 'graphql-upload-minimal';
import { AppointmentResolver } from './resolvers/appointment';
import { AppointmentRequestResolver } from './resolvers/appointRequest';
import { NutritionPlanResolver } from './resolvers/mealScheduler';

const main = async () => {
  // In order to interact with the database and hold my db connection settings, i have to initialize dataSource
  AppDataSource.initialize()
    .then(() => {
      console.log('Data Source has been initialized!');
    })
    .catch((err) => {
      console.error('Error during Data Source initialization', err);
    });

  // Let's create the express server
  const app = express();
  const httpServer = createServer(app);

  // Here we will connect redis in order to make faster queries in the server side in addition with my cookie

  const RedisStore = require('connect-redis').default;
  const redis = new Redis(process.env.REDIS_URL!);

  // I define my cookie and it's settings

  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redis,
        disableTTL: true,
        disableTouch: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 4, //4years
        httpOnly: true,
        sameSite: 'lax',
        secure: false, // cookie only works in https, when sameSite = none then secure is true => playground and when same site is lax secure is false => web
      },
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET!,
      resave: false,
    })
  );

  // Here i create an apollo server instance in order to create my schema and the resolvers usings typegraphql

  const apolloServer = new ApolloServer<MyContext>({
    schema: await buildSchema({
      resolvers: [
        UserResolver,
        ArticleResolver,
        AppointmentResolver,
        AppointmentRequestResolver,
        NutritionPlanResolver,
      ],
      validate: false,
    }),
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  app.use(
    graphqlUploadExpress({
      maxFileSize: 1000000000,
      maxFiles: 10,
    })
  );

  app.use(express.static('public'));

  // I start my server
  await apolloServer.start();

  app.set('trust proxy', true);
  // I declare my cors and expressMiddlaware in order for me to use apollo-express-server
  app.use(
    '/graphql',
    cors<cors.CorsRequest>({
      origin: ['http://localhost:3000', 'https://studio.apollographql.com'],
      credentials: true,
    }),
    bodyParser.json(),
    expressMiddleware(apolloServer, {
      context: async ({ req, res }) => ({ req, res, redis: redis }),
    })
  );

  // I define the port of the server
  httpServer.listen(4000, () => {
    console.log('Server started on localhost:4000/graphql');
  });
};

main().catch((err) => {
  console.error(err);
});
