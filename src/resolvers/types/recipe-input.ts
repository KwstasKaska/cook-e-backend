import { InputType, Field, Int } from 'type-graphql';
import { Difficulty } from '../../entities/Chef/Recipe';

//Ingredient line inside a recipe

@InputType()
export class RecipeIngredientInput {
  @Field(() => Int)
  ingredientId: number;

  @Field(() => Int)
  quantity: number;

  @Field(() => String, { nullable: true })
  unit?: string;
}

//Step line inside a recipe

@InputType()
export class RecipeStepInput {
  @Field(() => String)
  body: string;
}

//Create

@InputType({ description: 'Create Recipe Data' })
export class CreateRecipeInput {
  @Field(() => String)
  title: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => String, { nullable: true })
  chefComment?: string;

  @Field(() => String, { nullable: true })
  recipeImage?: string;

  @Field(() => Difficulty)
  difficulty: Difficulty;

  @Field(() => Int)
  prepTime: number;

  @Field(() => Int)
  cookTime: number;

  @Field(() => Int, { nullable: true })
  restTime?: number;

  @Field(() => String, { nullable: true })
  foodEthnicity?: string;

  @Field(() => String, { nullable: true })
  foodEvent?: string;

  @Field(() => Int, { nullable: true })
  caloriesTotal?: number;

  // Relation arrays
  @Field(() => [RecipeIngredientInput])
  ingredients: RecipeIngredientInput[];

  @Field(() => [RecipeStepInput])
  steps: RecipeStepInput[];

  @Field(() => [Int], { nullable: true })
  utensilIds?: number[];
}

//Update

@InputType({ description: 'Update Recipe Data' })
export class UpdateRecipeInput {
  @Field(() => Int)
  id: number;

  @Field(() => String, { nullable: true })
  title?: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => String, { nullable: true })
  chefComment?: string;

  @Field(() => String, { nullable: true })
  recipeImage?: string;

  @Field(() => Difficulty, { nullable: true })
  difficulty?: Difficulty;

  @Field(() => Int, { nullable: true })
  prepTime?: number;

  @Field(() => Int, { nullable: true })
  cookTime?: number;

  @Field(() => Int, { nullable: true })
  restTime?: number;

  @Field(() => String, { nullable: true })
  foodEthnicity?: string;

  @Field(() => String, { nullable: true })
  foodEvent?: string;

  @Field(() => Int, { nullable: true })
  caloriesTotal?: number;

  // When provided, the existing ingredients/steps/utensils are replaced entirely
  @Field(() => [RecipeIngredientInput], { nullable: true })
  ingredients?: RecipeIngredientInput[];

  @Field(() => [RecipeStepInput], { nullable: true })
  steps?: RecipeStepInput[];

  @Field(() => [Int], { nullable: true })
  utensilIds?: number[];
}
