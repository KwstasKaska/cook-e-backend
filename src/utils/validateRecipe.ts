import {
  CreateRecipeInput,
  UpdateRecipeInput,
} from '../resolvers/types/recipe-input';

export const validateCreateRecipe = (data: CreateRecipeInput) => {
  if (!data.title)
    return [{ field: 'title', message: 'error.recipe_title_required' }];
  if (!data.difficulty)
    return [
      { field: 'difficulty', message: 'error.recipe_difficulty_required' },
    ];
  if (!data.prepTime || data.prepTime <= 0)
    return [{ field: 'prepTime', message: 'error.recipe_prep_time_invalid' }];
  if (!data.cookTime || data.cookTime <= 0)
    return [{ field: 'cookTime', message: 'error.recipe_cook_time_invalid' }];
  if (!data.ingredients || data.ingredients.length === 0)
    return [
      { field: 'ingredients', message: 'error.recipe_ingredients_required' },
    ];
  if (!data.steps || data.steps.length === 0)
    return [{ field: 'steps', message: 'error.recipe_steps_required' }];
  return null;
};

export const validateUpdateRecipe = (data: UpdateRecipeInput) => {
  if (data.title !== undefined && !data.title)
    return [{ field: 'title', message: 'error.recipe_title_empty' }];
  if (data.prepTime !== undefined && data.prepTime <= 0)
    return [{ field: 'prepTime', message: 'error.recipe_prep_time_invalid' }];
  if (data.cookTime !== undefined && data.cookTime <= 0)
    return [{ field: 'cookTime', message: 'error.recipe_cook_time_invalid' }];
  if (data.ingredients !== undefined && data.ingredients.length < 1)
    return [{ field: 'ingredients', message: 'error.recipe_ingredients_min' }];
  if (data.steps !== undefined && data.steps.length === 0)
    return [{ field: 'steps', message: 'error.recipe_steps_required' }];
  return null;
};
