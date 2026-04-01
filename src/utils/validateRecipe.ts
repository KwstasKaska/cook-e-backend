import {
  CreateRecipeInput,
  UpdateRecipeInput,
} from '../resolvers/types/recipe-input';

export const validateCreateRecipe = (data: CreateRecipeInput) => {
  if (!data.title) {
    return [{ field: 'title', message: 'Εισάγετε τίτλο για την συνταγή σας.' }];
  }

  if (!data.difficulty) {
    return [{ field: 'difficulty', message: 'Επιλέξτε επίπεδο δυσκολίας.' }];
  }

  if (!data.prepTime || data.prepTime <= 0) {
    return [
      { field: 'prepTime', message: 'Εισάγετε έγκυρο χρόνο προετοιμασίας.' },
    ];
  }

  if (!data.cookTime || data.cookTime <= 0) {
    return [
      { field: 'cookTime', message: 'Εισάγετε έγκυρο χρόνο μαγειρέματος.' },
    ];
  }

  if (!data.ingredients || data.ingredients.length === 0) {
    return [
      {
        field: 'ingredients',
        message: 'Η συνταγή πρέπει να έχει τουλάχιστον ένα υλικό.',
      },
    ];
  }

  if (!data.steps || data.steps.length === 0) {
    return [
      {
        field: 'steps',
        message: 'Η συνταγή πρέπει να έχει τουλάχιστον ένα βήμα.',
      },
    ];
  }

  return null;
};

export const validateUpdateRecipe = (data: UpdateRecipeInput) => {
  if (data.title !== undefined && !data.title) {
    return [{ field: 'title', message: 'Ο τίτλος δεν μπορεί να είναι κενός.' }];
  }

  if (data.prepTime !== undefined && data.prepTime <= 0) {
    return [
      { field: 'prepTime', message: 'Εισάγετε έγκυρο χρόνο προετοιμασίας.' },
    ];
  }

  if (data.cookTime !== undefined && data.cookTime <= 0) {
    return [
      { field: 'cookTime', message: 'Εισάγετε έγκυρο χρόνο μαγειρέματος.' },
    ];
  }

  if (data.ingredients !== undefined && data.ingredients.length === 3) {
    return [
      {
        field: 'ingredients',
        message: 'Η συνταγή πρέπει να έχει τουλάχιστον τρία υλικά.',
      },
    ];
  }

  if (data.steps !== undefined && data.steps.length === 0) {
    return [
      {
        field: 'steps',
        message: 'Η συνταγή πρέπει να έχει τουλάχιστον ένα βήμα.',
      },
    ];
  }

  return null;
};
