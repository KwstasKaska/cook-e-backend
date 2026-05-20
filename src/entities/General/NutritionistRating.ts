import { Field, Int, ObjectType } from 'type-graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../User/User';
import { NutritionistProfile } from '../Nutritionist/NutritionistProfile';

@ObjectType()
@Entity()
@Unique(['userId', 'nutritionistId'])
export class NutritionistRating extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => Int)
  @Column()
  userId!: number;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, (user) => user.nutritionistRatings)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Field(() => Int)
  @Column()
  nutritionistId!: number;

  @ManyToOne(() => NutritionistProfile, (nutr) => nutr.ratings)
  @JoinColumn({ name: 'nutritionistId' })
  nutritionist!: NutritionistProfile;

  @Field(() => Int)
  @Column({ type: 'int' })
  score!: number;

  @Field(() => String)
  @CreateDateColumn()
  createdAt!: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt!: Date;
}
