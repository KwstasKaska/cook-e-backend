// Utensil.ts
import { Field, ObjectType } from 'type-graphql';
import {
  BaseEntity,
  Column,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Recipe } from './Recipe';

@ObjectType()
@Entity()
export class Utensil extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column()
  category: string;

  @ManyToMany(() => Recipe, (recipe) => recipe.utensils)
  recipes: Recipe[];
}
