import { Field, Int, ObjectType } from 'type-graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
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
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Field(() => Int)
  @Column()
  recipeId!: number;

  @Field(() => Recipe, { nullable: true })
  @ManyToOne(() => Recipe, (recipe) => recipe.cookedLogs)
  @JoinColumn({ name: 'recipeId' })
  recipe!: Recipe;

  @Field(() => String)
  @CreateDateColumn()
  cookedAt!: Date;
}
