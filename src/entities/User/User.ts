import { Field, ObjectType } from 'type-graphql';
import { Column, Entity, OneToMany } from 'typeorm';
import { Information } from '../General/Information';
import { Article } from '../Nutritionist/Article';
import { AppointmentRequest } from '../Nutritionist/AppointmentRequest';
import { MealScheduler } from '../Nutritionist/MealScheduler';

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
    (appointmentReq) => appointmentReq.client
  )
  appointmentReqs: AppointmentRequest[];

  @OneToMany(() => MealScheduler, (plan) => plan.user)
  nutritionPlans: MealScheduler[];
}
