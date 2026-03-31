import { Field, Float, ObjectType } from 'type-graphql';
import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IngredientsCategory } from './IngredientsCategory';
import { RecipeIngredient } from './RecipeIngredient';

@ObjectType()
@Entity()
export class Ingredient extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => String)
  @Column({ unique: true })
  name!: string;

  @Field(() => Float, { nullable: true, description: 'Θερμίδες ανά 100g' })
  @Column({ type: 'float', nullable: true })
  caloriesPer100g?: number;

  @Field(() => [RecipeIngredient], { nullable: true })
  @OneToMany(() => RecipeIngredient, (ri) => ri.ingredient)
  recipeIngredients: RecipeIngredient[];

  @ManyToOne(
    () => IngredientsCategory,
    (ingredientCategory) => ingredientCategory.ingredients
  )
  category: IngredientsCategory;
}
