import { Field, Float, InputType, Int } from 'type-graphql';
import { Difficulty, RecipeCategory } from '../../entities/Chef/Recipe';

@InputType()
export class RecipeIngredientInput {
  @Field(() => Int)
  ingredientId: number;

  @Field(() => String)
  quantity: string;

  @Field(() => String)
  unit: string;
}

@InputType()
export class RecipeStepInput {
  @Field(() => String)
  body: string;
}

@InputType()
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

  @Field(() => RecipeCategory, { nullable: true })
  category?: RecipeCategory;

  // ── Macros ─────────────────────────────────────────────────────────

  @Field(() => Float, { nullable: true })
  caloriesTotal?: number;

  @Field(() => Float, { nullable: true })
  protein?: number;

  @Field(() => Float, { nullable: true })
  carbs?: number;

  @Field(() => Float, { nullable: true })
  fat?: number;

  // ── Relations ──────────────────────────────────────────────────────

  @Field(() => [RecipeIngredientInput])
  ingredients: RecipeIngredientInput[];

  @Field(() => [RecipeStepInput])
  steps: RecipeStepInput[];

  @Field(() => [Int], { nullable: true })
  utensilIds?: number[];
}

@InputType()
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

  @Field(() => RecipeCategory, { nullable: true })
  category?: RecipeCategory;

  // ── Macros ─────────────────────────────────────────────────────────

  @Field(() => Float, { nullable: true })
  caloriesTotal?: number;

  @Field(() => Float, { nullable: true })
  protein?: number;

  @Field(() => Float, { nullable: true })
  carbs?: number;

  @Field(() => Float, { nullable: true })
  fat?: number;

  // ── Relations ──────────────────────────────────────────────────────

  @Field(() => [RecipeIngredientInput], { nullable: true })
  ingredients?: RecipeIngredientInput[];

  @Field(() => [RecipeStepInput], { nullable: true })
  steps?: RecipeStepInput[];

  @Field(() => [Int], { nullable: true })
  utensilIds?: number[];
}
