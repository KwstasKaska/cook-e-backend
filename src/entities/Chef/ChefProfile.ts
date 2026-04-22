import { Field, ObjectType } from 'type-graphql';
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../User/User';
import { Recipe } from './Recipe';
import { ChefRating } from '../General/ChefRating';

@ObjectType()
@Entity()
export class ChefProfile extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => User)
  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  bio?: string;

  @Field(() => [Recipe], { nullable: true })
  @OneToMany(() => Recipe, (recipe) => recipe.author)
  recipes: Recipe[];

  @Field(() => [ChefRating], { nullable: true })
  @OneToMany(() => ChefRating, (rating) => rating.chef)
  ratings: ChefRating[];
}
