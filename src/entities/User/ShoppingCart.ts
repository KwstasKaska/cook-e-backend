import { Field, Int, ObjectType } from 'type-graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './User';
import { Ingredient } from '../Chef/Ingredient';

@ObjectType()
@Entity()
export class ShoppingCart extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => Int)
  @Column()
  userId!: number;

  @ManyToOne(() => User, (user) => user.cartItems)
  user!: User;

  @Field(() => Int)
  @Column()
  ingredientId!: number;

  @Field(() => Ingredient, { nullable: true })
  @ManyToOne(() => Ingredient)
  ingredient!: Ingredient;

  @Field(() => String)
  @CreateDateColumn()
  addedAt!: Date;
}
