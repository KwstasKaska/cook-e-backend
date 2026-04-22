import { Field, Int, ObjectType } from 'type-graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../User/User';
import { Recipe } from '../Chef/Recipe';

@ObjectType()
@Entity()
export class CookedRecipe extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => Int)
  @Column()
  userId!: number;

  @ManyToOne(() => User, (user) => user.cookedRecipes)
  user!: User;

  @Field(() => Int)
  @Column()
  recipeId!: number;

  @Field(() => Recipe, { nullable: true })
  @ManyToOne(() => Recipe, (recipe) => recipe.cookedLogs)
  recipe!: Recipe;

  // No unique constraint — same recipe can be logged multiple times
  // Each entry = one cook session, macros count once per entry
  @Field(() => String)
  @CreateDateColumn()
  cookedAt!: Date;
}
