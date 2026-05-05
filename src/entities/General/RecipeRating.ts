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
import { Recipe } from '../Chef/Recipe';

@ObjectType()
@Entity()
@Unique(['userId', 'recipeId'])
export class RecipeRating extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => Int)
  @Column()
  userId!: number;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, (user) => user.recipeRatings)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Field(() => Int)
  @Column()
  recipeId!: number;

  @ManyToOne(() => Recipe, (recipe) => recipe.ratings)
  @JoinColumn({ name: 'recipeId' })
  recipe!: Recipe;

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
