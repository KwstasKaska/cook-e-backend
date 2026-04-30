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
@Unique(['userId', 'recipeId'])
export class UserFavorite extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  // το δευτερεύων κλειδί για την συσχέτιση με τον πίνακα του χρήστη
  @Field(() => Int)
  @Column()
  userId!: number;

  @ManyToOne(() => User, (user) => user.favorites)
  user!: User;

  // το δευτερεύων κλειδί για την συσχέτιση με τον πίνακα της συνταγής
  @Field(() => Int)
  @Column()
  recipeId!: number;

  @Field(() => Recipe, { nullable: true })
  @ManyToOne(() => Recipe, (recipe) => recipe.favoritedBy)
  recipe!: Recipe;

  @Field(() => String)
  @CreateDateColumn()
  savedAt!: Date;
}
