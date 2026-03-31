import { Field, ObjectType } from 'type-graphql';
import {
  BaseEntity,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../User/User';
import { Recipe } from './Recipe';

@ObjectType()
@Entity()
export class ChefProfile extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @OneToMany(() => Recipe, (recipe) => recipe.author)
  recipes: Recipe[];
}
