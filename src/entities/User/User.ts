import { Field, ObjectType } from 'type-graphql';
import { Column, Entity, OneToMany } from 'typeorm';
import { Information } from '../General/Information';
import { Article } from '../Nutritionist/Article';
import { AppointmentRequest } from '../Nutritionist/AppointmentRequest';
import { MealScheduler } from '../Nutritionist/MealScheduler';
import { ShoppingCart } from './ShoppingCart';
import { Conversation } from '../Messsaging/Conversation';
import { Message } from '../Messsaging/Message';
import { UserFavorite } from './UserFavorite';
import { ChefRating } from '../General/ChefRating';
import { RecipeRating } from '../General/RecipeRating';
import { CookedRecipe } from './CookedRecipe';

@ObjectType()
@Entity()
export class User extends Information {
  @Field(() => String, { nullable: true })
  @Column({ unique: true, nullable: true })
  phoneNumber: string;

  @OneToMany(() => Article, (article) => article.creator)
  articles: Article[];

  @OneToMany(
    () => AppointmentRequest,
    (appointmentReq) => appointmentReq.client,
  )
  appointmentReqs: AppointmentRequest[];

  @OneToMany(() => MealScheduler, (plan) => plan.user)
  nutritionPlans: MealScheduler[];

  @OneToMany(() => ShoppingCart, (item) => item.user)
  cartItems: ShoppingCart[];

  @OneToMany(() => UserFavorite, (fav) => fav.user)
  favorites: UserFavorite[];

  @OneToMany(() => ChefRating, (rating) => rating.user)
  chefRatings: ChefRating[];

  @OneToMany(() => RecipeRating, (rating) => rating.user)
  recipeRatings: RecipeRating[];

  @OneToMany(() => CookedRecipe, (log) => log.user)
  cookedRecipes: CookedRecipe[];

  @OneToMany(() => Conversation, (conversation) => conversation.participant1)
  conversationsAsParticipant1: Conversation[];

  @OneToMany(() => Conversation, (conversation) => conversation.participant2)
  conversationsAsParticipant2: Conversation[];

  @OneToMany(() => Message, (message) => message.sender)
  sentMessages: Message[];
}
