import {
  Arg,
  Ctx,
  Int,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from 'type-graphql';
import { Recipe } from '../entities/Chef/Recipe';
import { RecipeIngredient } from '../entities/Chef/RecipeIngredient';
import { Step } from '../entities/Chef/Step';
import { Utensil } from '../entities/Chef/Utensil';
import { Ingredient } from '../entities/Chef/Ingredient';
import { ChefProfile } from '../entities/Chef/ChefProfile';
import { isAuth } from '../middleware/isAuth';
import { isChef } from '../middleware/isChef';
import { MyContext } from '../types';
import AppDataSource from '../app-data-source';
import { CreateRecipeInput, UpdateRecipeInput } from './types/recipe-input';
import { RecipeResponse } from './types/recipe-object';
import { In } from 'typeorm';

@Resolver(Recipe)
export class RecipeResolver {
  //Public Queries

  @Query(() => [Recipe])
  async recipes(): Promise<Recipe[]> {
    return Recipe.find({
      relations: ['author', 'author.user'],
      order: { createdAt: 'DESC' },
    });
  }

  @Query(() => Recipe, { nullable: true })
  async recipe(@Arg('id', () => Int) id: number): Promise<Recipe | null> {
    return Recipe.findOne({
      where: { id },
      relations: [
        'author',
        'author.user',
        'recipeIngredients',
        'recipeIngredients.ingredient',
        'recipeIngredients.ingredient.category',
        'steps',
        'utensils',
      ],
    });
  }

  // Chef Queries

  @Query(() => [Recipe])
  @UseMiddleware(isAuth, isChef)
  async myRecipes(@Ctx() { req }: MyContext): Promise<Recipe[]> {
    const chefProfile = await ChefProfile.findOne({
      where: { user: { id: req.session.userId } },
    });

    if (!chefProfile) {
      throw new Error('Δεν βρέθηκε προφίλ μάγειρα.');
    }

    return Recipe.find({
      where: { authorId: chefProfile.id },
      relations: [
        'recipeIngredients',
        'recipeIngredients.ingredient',
        'recipeIngredients.ingredient.category',
        'steps',
        'utensils',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  //Chef Mutations

  @Mutation(() => RecipeResponse)
  @UseMiddleware(isAuth, isChef)
  async createRecipe(
    @Arg('data') data: CreateRecipeInput,
    @Ctx() { req }: MyContext,
  ): Promise<RecipeResponse> {
    const chefProfile = await ChefProfile.findOne({
      where: { user: { id: req.session.userId } },
    });

    if (!chefProfile) {
      return {
        errors: [{ field: 'chef', message: 'Δεν βρέθηκε προφίλ μάγειρα.' }],
      };
    }

    if (!data.ingredients || data.ingredients.length === 0) {
      return {
        errors: [
          {
            field: 'ingredients',
            message: 'Η συνταγή πρέπει να έχει τουλάχιστον ένα υλικό.',
          },
        ],
      };
    }

    if (!data.steps || data.steps.length === 0) {
      return {
        errors: [
          {
            field: 'steps',
            message: 'Η συνταγή πρέπει να έχει τουλάχιστον ένα βήμα.',
          },
        ],
      };
    }

    return await AppDataSource.transaction(async (manager) => {
      // 1. Create the recipe
      const recipe = manager.create(Recipe, {
        title: data.title,
        description: data.description,
        chefComment: data.chefComment,
        recipeImage: data.recipeImage,
        difficulty: data.difficulty,
        prepTime: data.prepTime,
        cookTime: data.cookTime,
        restTime: data.restTime,
        foodEthnicity: data.foodEthnicity,
        foodEvent: data.foodEvent,
        caloriesTotal: data.caloriesTotal,
        author: chefProfile,
      });

      await manager.save(recipe);

      // 2. Create RecipeIngredient join rows
      for (const ing of data.ingredients) {
        const ingredient = await manager.findOne(Ingredient, {
          where: { id: ing.ingredientId },
        });

        if (!ingredient) {
          throw new Error(`Το υλικό με id ${ing.ingredientId} δεν βρέθηκε.`);
        }

        const recipeIngredient = manager.create(RecipeIngredient, {
          recipeId: recipe.id,
          ingredientId: ing.ingredientId,
          quantity: ing.quantity,
          unit: ing.unit,
        });

        await manager.save(recipeIngredient);
      }

      // 3. Create steps
      for (const s of data.steps) {
        const step = manager.create(Step, {
          body: s.body,
          recipeID: recipe.id,
        });
        await manager.save(step);
      }

      // 4. Attach utensils
      if (data.utensilIds && data.utensilIds.length > 0) {
        const utensils = await manager.findBy(Utensil, {
          id: In(data.utensilIds),
        });
        recipe.utensils = utensils;
        await manager.save(recipe);
      }

      // 5. Return with all relations loaded
      const fullRecipe = await manager.findOne(Recipe, {
        where: { id: recipe.id },
        relations: [
          'author',
          'author.user',
          'recipeIngredients',
          'recipeIngredients.ingredient',
          'recipeIngredients.ingredient.category',
          'steps',
          'utensils',
        ],
      });

      return { recipe: fullRecipe! };
    }).catch((err) => {
      console.error('[createRecipe] Error:', err);
      return {
        errors: [
          {
            field: 'server',
            message:
              err.message ??
              'Κάτι πήγε λάθος κατά την δημιουργία της συνταγής.',
          },
        ],
      };
    });
  }

  @Mutation(() => RecipeResponse)
  @UseMiddleware(isAuth, isChef)
  async updateRecipe(
    @Arg('data') data: UpdateRecipeInput,
    @Ctx() { req }: MyContext,
  ): Promise<RecipeResponse> {
    const chefProfile = await ChefProfile.findOne({
      where: { user: { id: req.session.userId } },
    });

    if (!chefProfile) {
      return {
        errors: [{ field: 'chef', message: 'Δεν βρέθηκε προφίλ μάγειρα.' }],
      };
    }

    const recipe = await Recipe.findOne({
      where: { id: data.id, authorId: chefProfile.id },
    });

    if (!recipe) {
      return {
        errors: [
          {
            field: 'recipe',
            message: 'Η συνταγή δεν βρέθηκε ή δεν σας ανήκει.',
          },
        ],
      };
    }

    return await AppDataSource.transaction(async (manager) => {
      // 1. Update scalar fields
      if (data.title !== undefined) recipe.title = data.title;
      if (data.description !== undefined) recipe.description = data.description;
      if (data.chefComment !== undefined) recipe.chefComment = data.chefComment;
      if (data.recipeImage !== undefined) recipe.recipeImage = data.recipeImage;
      if (data.difficulty !== undefined) recipe.difficulty = data.difficulty;
      if (data.prepTime !== undefined) recipe.prepTime = data.prepTime;
      if (data.cookTime !== undefined) recipe.cookTime = data.cookTime;
      if (data.restTime !== undefined) recipe.restTime = data.restTime;
      if (data.foodEthnicity !== undefined)
        recipe.foodEthnicity = data.foodEthnicity;
      if (data.foodEvent !== undefined) recipe.foodEvent = data.foodEvent;
      if (data.caloriesTotal !== undefined)
        recipe.caloriesTotal = data.caloriesTotal;

      await manager.save(recipe);

      // 2. Replace ingredients if provided
      if (data.ingredients !== undefined) {
        await manager.delete(RecipeIngredient, { recipeId: recipe.id });

        for (const ing of data.ingredients) {
          const ingredient = await manager.findOne(Ingredient, {
            where: { id: ing.ingredientId },
          });

          if (!ingredient) {
            throw new Error(`Το υλικό με id ${ing.ingredientId} δεν βρέθηκε.`);
          }

          const recipeIngredient = manager.create(RecipeIngredient, {
            recipeId: recipe.id,
            ingredientId: ing.ingredientId,
            quantity: ing.quantity,
            unit: ing.unit,
          });

          await manager.save(recipeIngredient);
        }
      }

      // 3. Replace steps if provided
      if (data.steps !== undefined) {
        await manager.delete(Step, { recipeID: recipe.id });

        for (const s of data.steps) {
          const step = manager.create(Step, {
            body: s.body,
            recipeID: recipe.id,
          });
          await manager.save(step);
        }
      }

      // 4. Replace utensils if provided
      if (data.utensilIds !== undefined) {
        recipe.utensils =
          data.utensilIds.length > 0
            ? await manager.findBy(Utensil, { id: In(data.utensilIds) })
            : [];
        await manager.save(recipe);
      }

      // 5. Return with all relations loaded
      const fullRecipe = await manager.findOne(Recipe, {
        where: { id: recipe.id },
        relations: [
          'author',
          'author.user',
          'recipeIngredients',
          'recipeIngredients.ingredient',
          'recipeIngredients.ingredient.category',
          'steps',
          'utensils',
        ],
      });

      return { recipe: fullRecipe! };
    }).catch((err) => {
      console.error('[updateRecipe] Error:', err);
      return {
        errors: [
          {
            field: 'server',
            message:
              err.message ?? 'Κάτι πήγε λάθος κατά την ενημέρωση της συνταγής.',
          },
        ],
      };
    });
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth, isChef)
  async deleteRecipe(
    @Arg('id', () => Int) id: number,
    @Ctx() { req }: MyContext,
  ): Promise<boolean> {
    const chefProfile = await ChefProfile.findOne({
      where: { user: { id: req.session.userId } },
    });

    if (!chefProfile) return false;

    const recipe = await Recipe.findOne({
      where: { id, authorId: chefProfile.id },
    });

    if (!recipe) return false;

    await RecipeIngredient.delete({ recipeId: id });
    await Step.delete({ recipeID: id });
    await Recipe.delete({ id });

    return true;
  }
}
