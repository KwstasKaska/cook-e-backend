import {
  Arg,
  Ctx,
  Int,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from 'type-graphql';
import { Recipe, RecipeCategory } from '../entities/Chef/Recipe';
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
import {
  validateCreateRecipe,
  validateUpdateRecipe,
} from '../utils/validateRecipe';
import { In } from 'typeorm';
import { translateText } from '../utils/translate';

@Resolver(Recipe)
export class RecipeResolver {
  //  Public Queries

  @Query(() => [Recipe])
  async recipes(
    @Arg('limit', () => Int, { defaultValue: 10 }) limit: number,
    @Arg('offset', () => Int, { defaultValue: 0 }) offset: number,
  ): Promise<Recipe[]> {
    return Recipe.find({
      relations: ['author', 'author.user'],
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 50),
      skip: offset,
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

  // Filter all public recipes by category — used by the UI tabs
  @Query(() => [Recipe])
  async recipesByCategory(
    @Arg('category', () => RecipeCategory) category: RecipeCategory,
    @Arg('limit', () => Int, { defaultValue: 10 }) limit: number,
    @Arg('offset', () => Int, { defaultValue: 0 }) offset: number,
  ): Promise<Recipe[]> {
    return Recipe.find({
      where: { category },
      relations: ['author', 'author.user'],
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 50),
      skip: offset,
    });
  }

  // Public recipes by chef — used on the user-facing chef profile page
  @Query(() => [Recipe])
  async recipesByChef(
    @Arg('chefId', () => Int) chefId: number,
    @Arg('limit', () => Int, { defaultValue: 6 }) limit: number,
    @Arg('offset', () => Int, { defaultValue: 0 }) offset: number,
  ): Promise<Recipe[]> {
    return Recipe.find({
      where: { authorId: chefId },
      relations: [
        'recipeIngredients',
        'recipeIngredients.ingredient',
        'recipeIngredients.ingredient.category',
        'steps',
        'utensils',
      ],
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 50),
      skip: offset,
    });
  }

  // Chef Queries

  @Query(() => [Recipe])
  @UseMiddleware(isAuth, isChef)
  async myRecipes(
    @Ctx() { req }: MyContext,
    @Arg('limit', () => Int, { defaultValue: 10 }) limit: number,
    @Arg('offset', () => Int, { defaultValue: 0 }) offset: number,
  ): Promise<Recipe[]> {
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
      take: Math.min(limit, 50),
      skip: offset,
    });
  }

  // Chef's own recipes filtered by category
  @Query(() => [Recipe])
  @UseMiddleware(isAuth, isChef)
  async myRecipesByCategory(
    @Arg('category', () => RecipeCategory) category: RecipeCategory,
    @Ctx() { req }: MyContext,
    @Arg('limit', () => Int, { defaultValue: 10 }) limit: number,
    @Arg('offset', () => Int, { defaultValue: 0 }) offset: number,
  ): Promise<Recipe[]> {
    const chefProfile = await ChefProfile.findOne({
      where: { user: { id: req.session.userId } },
    });

    if (!chefProfile) {
      throw new Error('Δεν βρέθηκε προφίλ μάγειρα.');
    }

    return Recipe.find({
      where: { authorId: chefProfile.id, category },
      relations: [
        'recipeIngredients',
        'recipeIngredients.ingredient',
        'recipeIngredients.ingredient.category',
        'steps',
        'utensils',
      ],
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 50),
      skip: offset,
    });
  }

  // ── Chef Mutations ─────────────────────────────────────────────────

  @Mutation(() => RecipeResponse)
  @UseMiddleware(isAuth, isChef)
  async createRecipe(
    @Arg('data') data: CreateRecipeInput,
    @Ctx() { req }: MyContext,
  ): Promise<RecipeResponse> {
    const errors = validateCreateRecipe(data);
    if (errors) return { errors };

    const chefProfile = await ChefProfile.findOne({
      where: { user: { id: req.session.userId } },
    });

    if (!chefProfile) {
      return {
        errors: [{ field: 'chef', message: 'Δεν βρέθηκε προφίλ μάγειρα.' }],
      };
    }

    const [title_en, description_en, chefComment_en] = await Promise.all([
      translateText(data.title),
      data.description
        ? translateText(data.description)
        : Promise.resolve(undefined),
      data.chefComment
        ? translateText(data.chefComment)
        : Promise.resolve(undefined),
    ]);

    return await AppDataSource.transaction(async (manager) => {
      // 1. Create recipe
      const recipe = manager.create(Recipe, {
        title_el: data.title,
        title_en,
        description_el: data.description,
        description_en,
        chefComment_el: data.chefComment,
        chefComment_en,
        recipeImage: data.recipeImage,
        difficulty: data.difficulty,
        prepTime: data.prepTime,
        cookTime: data.cookTime,
        restTime: data.restTime,
        foodEthnicity: data.foodEthnicity,
        category: data.category,
        caloriesTotal: data.caloriesTotal,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        author: chefProfile,
      });

      await manager.save(recipe);

      // 2. Insert RecipeIngredient rows — use insert() for composite PK
      for (const ing of data.ingredients) {
        const ingredient = await manager.findOne(Ingredient, {
          where: { id: ing.ingredientId },
        });

        if (!ingredient) {
          throw new Error(`Το υλικό με id ${ing.ingredientId} δεν βρέθηκε.`);
        }

        await manager.insert(RecipeIngredient, {
          recipeId: recipe.id,
          ingredientId: ing.ingredientId,
          quantity: ing.quantity,
          unit: ing.unit,
        });
      }

      // 3. Create steps — translate all bodies in parallel
      const stepTranslations = await Promise.all(
        data.steps.map((s) => translateText(s.body)),
      );

      for (let i = 0; i < data.steps.length; i++) {
        const step = manager.create(Step, {
          body_el: data.steps[i].body,
          body_en: stepTranslations[i],
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
    const errors = validateUpdateRecipe(data);
    if (errors) return { errors };

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

    const [title_en, description_en, chefComment_en] = await Promise.all([
      data.title ? translateText(data.title) : Promise.resolve(undefined),
      data.description
        ? translateText(data.description)
        : Promise.resolve(undefined),
      data.chefComment
        ? translateText(data.chefComment)
        : Promise.resolve(undefined),
    ]);

    return await AppDataSource.transaction(async (manager) => {
      if (data.title !== undefined) {
        recipe.title_el = data.title;
        recipe.title_en = title_en!;
      }
      if (data.description !== undefined) {
        recipe.description_el = data.description;
        recipe.description_en = description_en;
      }
      if (data.chefComment !== undefined) {
        recipe.chefComment_el = data.chefComment;
        recipe.chefComment_en = chefComment_en;
      }
      if (data.recipeImage !== undefined) recipe.recipeImage = data.recipeImage;
      if (data.difficulty !== undefined) recipe.difficulty = data.difficulty;
      if (data.prepTime !== undefined) recipe.prepTime = data.prepTime;
      if (data.cookTime !== undefined) recipe.cookTime = data.cookTime;
      if (data.restTime !== undefined) recipe.restTime = data.restTime;
      if (data.foodEthnicity !== undefined)
        recipe.foodEthnicity = data.foodEthnicity;
      if (data.category !== undefined) recipe.category = data.category;
      if (data.caloriesTotal !== undefined)
        recipe.caloriesTotal = data.caloriesTotal;
      if (data.protein !== undefined) recipe.protein = data.protein;
      if (data.carbs !== undefined) recipe.carbs = data.carbs;
      if (data.fat !== undefined) recipe.fat = data.fat;

      await manager.save(recipe);

      if (data.ingredients !== undefined) {
        await manager.delete(RecipeIngredient, { recipeId: recipe.id });

        for (const ing of data.ingredients) {
          const ingredient = await manager.findOne(Ingredient, {
            where: { id: ing.ingredientId },
          });

          if (!ingredient) {
            throw new Error(`Το υλικό με id ${ing.ingredientId} δεν βρέθηκε.`);
          }

          await manager.insert(RecipeIngredient, {
            recipeId: recipe.id,
            ingredientId: ing.ingredientId,
            quantity: ing.quantity,
            unit: ing.unit,
          });
        }
      }

      if (data.steps !== undefined) {
        await manager.delete(Step, { recipeID: recipe.id });

        const stepTranslations = await Promise.all(
          data.steps.map((s) => translateText(s.body)),
        );

        for (let i = 0; i < data.steps.length; i++) {
          const step = manager.create(Step, {
            body_el: data.steps[i].body,
            body_en: stepTranslations[i],
            recipeID: recipe.id,
          });
          await manager.save(step);
        }
      }

      if (data.utensilIds !== undefined) {
        recipe.utensils =
          data.utensilIds.length > 0
            ? await manager.findBy(Utensil, { id: In(data.utensilIds) })
            : [];
        await manager.save(recipe);
      }

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
