import 'reflect-metadata'; // απαραίτητο να είναι πρώτο προκειμένου να λειτουργήσει το app data source
import * as dotenv from 'dotenv';
dotenv.config();
import AppDataSource from './app-data-source';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express, { Express } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import session from 'express-session';

import Redis from 'ioredis';
import { COOKIE_NAME } from './constants';
import { MyContext } from './types';
import { buildSchema } from 'type-graphql';
import bodyParser from 'body-parser';
import { ArticleResolver } from './resolvers/article';
import { AppointmentRequestResolver } from './resolvers/appointRequest';
import { UserResolver } from './resolvers/user';
import { graphqlUploadExpress } from 'graphql-upload-minimal';
import { AppointmentResolver } from './resolvers/appointment';
import { NutritionPlanResolver } from './resolvers/mealScheduler';
import {
  IngredientResolver,
  UtensilResolver,
} from './resolvers/ingredientAndUtensil';
import { RecipeResolver } from './resolvers/recipe';
import { ChefProfileResolver } from './resolvers/chefProfile';
import { ShoppingCartResolver } from './resolvers/shoppingCart';
import { NutritionistProfileResolver } from './resolvers/nutritionistProfile';
import { FavoritesResolver } from './resolvers/userFavorites';
import { MessagingResolver } from './resolvers/messaging';
import { CookedRecipeResolver } from './resolvers/cookedRecipe';
import { RatingResolver } from './resolvers/ratings';
import { RecipeSuggestionResolver } from './resolvers/recipeSuggestion';

const main = async () => {
  // Προκειμένου να συναναστρέφομαι με την βάση μου, χρειάζεται να κάνω initialize
  AppDataSource.initialize()
    .then(() => {
      console.log('Data Source has been initialized!');
    })
    .catch((err: unknown) => {
      console.error('Error during Data Source initialization', err);
    });

  // explicit type ώστε το TypeScript να ξέρει ότι είναι Express app, προκειμένου να δημιουργείται ένα πραγματικό port και μέσω του createserver δημιουργείται ένα http node server
  const app: Express = express();
  const httpServer = createServer(app);

  //αν δεν υπάρχει REDIS_URL χρησιμοποιούμε in-memory sessions προκειμένου να τρέχει ποιο γρήγορα μέσω redis, ουσιαστικά η διαδικασία ειναι ότι όταν δημιουργείται το session απο τον server, αυτό αποθηκεύεται στο redis και μετέπειτα αυτή η διασύνδεση στέλνει ελέγχους όπου τσεκάρει τα κλειδιά απο το cookie και το redis και καταλαβαίνει οτι αντιστοιχεί σε κάποιο session
  const RedisStore = require('connect-redis').default;
  const redis = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL, {
        tls: {},
      })
    : null;

  app.use(
    session({
      name: COOKIE_NAME,
      store: redis
        ? new RedisStore({
            client: redis,
            disableTTL: true, //για να μην επηρεάζει το redis το maxAge απο το cookie
            disableTouch: true, //για να μην ανανεώνω το session στο redis σε κάθε εντολή
          })
        : undefined,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 4, //μέγιστη διάρκεια ζωής του cookie
        httpOnly: true, //το χρησιμοποιώ για να εμποδίζει απο επιθέσεις στο cookie(να φαίνεται μόνο στον server)
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', //πρέπει να γίνει διαχωρισμός καθώς όταν το τρέχω, το back με το front end είναι διαφορετικά domains
        secure: process.env.NODE_ENV === 'production', //προτεικένου να δέχεται το https
      },
      saveUninitialized: false, //για να μην αποηθεύεται τίποτα όταν κάποιος δεν κάνει login
      secret: process.env.SESSION_SECRET!, //για ασφάλεια, επαληθεύεται το session και να ασφαλιστεί το cookie
      resave: false, //για να μην αλλάξει κάτι στο session χωρίς λ'ογο, πχ ακόμα και ένα απλό scroll
    }) as express.RequestHandler,
  );

  //δημιουργώ ένα apolloserver προκειμένου να δημιουργήσω το schema της βάσης μου και να δηλώσω όλα τα resolvers που θα περιλαμβάνουν τα queries και τα mutations για την διασύνδεση με το frontend.
  const apolloServer = new ApolloServer<MyContext>({
    schema: await buildSchema({
      resolvers: [
        UserResolver,
        ArticleResolver,
        AppointmentResolver,
        AppointmentRequestResolver,
        NutritionPlanResolver,
        RecipeResolver,
        ChefProfileResolver,
        IngredientResolver,
        UtensilResolver,
        NutritionistProfileResolver,
        ShoppingCartResolver,
        MessagingResolver,
        FavoritesResolver,
        RatingResolver,
        CookedRecipeResolver,
        RecipeSuggestionResolver,
      ],
      validate: false,
    }),
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  //χρησιμοποιώ το συγκεκριμένο προκειμένου να δέχεται ο server μου αρχεία μέσω της graphql, και είναι σημαντικό να είναι πριν το ξεκίνημα του server προκειμένου να δει το req και να το επεξεργαστεί, πριν πάει στο resolver.
  app.use(
    graphqlUploadExpress({
      maxFileSize: 1000000000,
      maxFiles: 10,
    }),
  );

  app.use(express.static('public'));

  //για να ξεκινήσει ο server
  await apolloServer.start();

  //το χρησιμοποιώ προκειμένου να δουλεύει το secure σωστά στο cookie.
  app.set('trust proxy', true);

  //το δημιουργώ προκειμένου να ορίσω τι θα επιτρέπεται στα /graphql endpoints
  app.use(
    '/graphql',
    cors({
      // ορίζω ποια endpoints θα μπορούν να βλέπουν τον server μου, το πρώτο ειναι για τοπικά, το δεύτερο για το apollo studio που κάνω το testing πριν την διασύνδεση, καθώς και το production
      origin: [
        'http://localhost:3000',
        'https://studio.apollographql.com',
        process.env.FRONTEND_URL!,
      ].filter(Boolean) as string[],
      credentials: true, //χωρίς αυτό το browser δεν στέλει cookies για την διασύνδεση του back με το front
    }),
    bodyParser.json(), //προκειμένου να διαβάζει το body των αιτημάτων σαν json αρχείο
    //προκειμένου να συνδέω τον Apollo με το Express και να δημιουργούνται τα στοιχεία που μου επιτρέπουν να χρησιμοποιώ το MyContext μέσα στους resolvers
    expressMiddleware(apolloServer, {
      context: async ({ req, res }) => ({ req, res, redis }),
    }),
  );

  //δηλώνω σε ποιο port θα βλέπει ο server
  httpServer.listen(4000, () => {
    console.log('Server started on localhost:4000/graphql');
  });
};

main().catch((err: unknown) => {
  console.error(err);
});
