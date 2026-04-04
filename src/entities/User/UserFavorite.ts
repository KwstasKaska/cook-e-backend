import { Field, Int, ObjectType } from 'type-graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../User/User';
import { Recipe } from '../Chef/Recipe';

@ObjectType()
@Entity()
@Unique(['userId', 'recipeId']) // one favorite entry per user per recipe
export class UserFavorite extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => Int)
  @Column()
  userId!: number;

  @ManyToOne(() => User, (user) => user.favorites)
  user!: User;

  @Field(() => Int)
  @Column()
  recipeId!: number;

  @ManyToOne(() => Recipe, (recipe) => recipe.favoritedBy)
  recipe!: Recipe;

  @Field(() => String)
  @CreateDateColumn()
  savedAt!: Date;
}
