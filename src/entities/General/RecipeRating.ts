import { Field, Int, ObjectType } from 'type-graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../User/User';
import { Recipe } from '../Chef/Recipe';

@ObjectType()
@Entity()
@Unique(['userId', 'recipeId']) // one rating per user per recipe
export class RecipeRating extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => Int)
  @Column()
  userId!: number;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, (user) => user.recipeRatings)
  user!: User;

  @Field(() => Int)
  @Column()
  recipeId!: number;

  @ManyToOne(() => Recipe, (recipe) => recipe.ratings)
  recipe!: Recipe;

  // 1–5 stars
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
