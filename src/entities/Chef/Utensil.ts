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
  name_el: string;

  @Field()
  @Column()
  name_en: string;

  @Field()
  @Column()
  category_el: string;

  @Field()
  @Column()
  category_en: string;

  @ManyToMany(() => Recipe, (recipe) => recipe.utensils)
  recipes: Recipe[];
}
