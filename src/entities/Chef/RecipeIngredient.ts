import { Field, Int, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { Ingredient } from './Ingredient';
import { Recipe } from './Recipe';

/* Στην συγκεκριμένη περίπτωση αυτή η οντότητα λειτουργεί σαν μεσολαβητής για την σχέση Many to Many μεταξύ των συνταγών και του βήματος της συνταγής
πχ
recipe -> join table <- ingredient
recipe -> RecipeIngredient <- ingredient

Όπου στην κοινή οντότητα δημιουργώ τις Many to One Relationships τόσο για την οντότητα Recipe όσο και για την οντότητα Step
και μετά στην εκάστοτε οντότητα δημιουργώ τις One to Many οι οποίες θα συνδέονται με την RecipeIngredient
*/

@ObjectType()
@Entity()
export class RecipeIngredient extends BaseEntity {
  @Field()
  @PrimaryColumn()
  recipeId: number;

  @ManyToOne(() => Recipe, (recipe) => recipe.recipeIngredients, {
    onDelete: 'CASCADE', // ουσιαστικά με αυτό επιτυγχάνω οτι αν διαγραφεί απο την βάση στο Recipe entity ενα κλειδί, τότε θα διαγραφεί και το παιδί για να μην υπάρξει κάποιο "ορφανό".
  })
  recipe: Recipe;

  @Field()
  @PrimaryColumn()
  ingredientId: number;

  @ManyToOne(() => Ingredient, (ingredient) => ingredient.recipeIngredients, {
    onDelete: 'CASCADE',
  })
  ingredient: Ingredient;

  @Field(() => Int)
  @Column()
  quantity: number;

  @Field(() => String)
  @Column({ type: 'text', nullable: true })
  unit: string;
}
