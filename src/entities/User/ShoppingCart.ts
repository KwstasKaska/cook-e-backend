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

  @ManyToOne(() => Ingredient)
  ingredient!: Ingredient;

  // How much of this ingredient the user needs
  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  quantity?: string;

  // e.g. "g", "ml", "pieces" — free text, user decides
  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  unit?: string;

  // Optional note e.g. "running low" or "for moussaka"
  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  note?: string;

  @Field(() => String)
  @CreateDateColumn()
  addedAt!: Date;
}
