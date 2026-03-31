import AppDataSource from './app-data-source';
import { Ingredient } from './entities/Chef/Ingredient';
import { IngredientsCategory } from './entities/Chef/IngredientsCategory';
import { Utensil } from './entities/Chef/Utensil';
import * as IngredientsEnums from './utils/ingredients';

enum Utensils {
  fork = 'Πιρούνι',
  knife = 'Μαχαίρι',
  spoon = 'Κουτάλι',
  ladle = 'Κουτάλα',
}

enum Vessel {
  pot = 'Κατσαρόλα',
  pan = 'Τηγάνι',
  wok = 'Γουόκ',
  oven = 'Φούρνος',
  steamer = 'Ατμομάγειρας',
  dutchOven = 'Γάστρα',
  pressureCooker = 'Χύτρα Ταχύτητας',
  airFryer = 'Φριτέζα Αέρα',
}

enum ExtraVessels {
  grater = 'Τρίφτης',
  blender = 'Μπλέντερ',
  cuttingBoard = 'Ξύλο Κοπής',
}

async function seedIngredientsFromEnums() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const ingredientRepo = AppDataSource.getRepository(Ingredient);
  const categoryRepo = AppDataSource.getRepository(IngredientsCategory);

  const ingredientCategoryNames = [
    'Vegetables',
    'Fruits',
    'Grain',
    'Dairy',
    'Meat',
    'Lipid',
    'Legumes',
    'Pastry',
    'Spices',
  ] as const;

  for (const categoryKey of ingredientCategoryNames) {
    // Αναζήτηση κατηγορίας στη βάση
    let category = await categoryRepo.findOneBy({
      name: categoryKey.toLowerCase(),
    });

    // Αν δεν υπάρχει, δημιουργία και αποθήκευση
    if (!category) {
      category = categoryRepo.create({
        name: categoryKey.toLowerCase(),
      });
      await categoryRepo.save(category);
    }

    const enumData = IngredientsEnums[categoryKey];
    if (!enumData) continue;

    for (const value of Object.values(enumData)) {
      // Έλεγχος αν το υλικό υπάρχει ήδη
      const existingIngredient = await ingredientRepo.findOneBy({
        name: value,
      });
      if (existingIngredient) continue;

      // Δημιουργία και αποθήκευση νέου υλικού
      const ingredient = ingredientRepo.create({
        name: value,
        category,
        caloriesPer100g: 0,
      });
      await ingredientRepo.save(ingredient);
    }
  }
}

async function seedUtensils() {
  const repo = AppDataSource.getRepository(Utensil);

  const insertEnumSet = async (enumObj: any, category: string) => {
    for (const key of Object.keys(enumObj)) {
      const name = enumObj[key];
      const exists = await repo.findOneBy({ name });
      if (!exists) {
        const utensil = repo.create({ name, category });
        await repo.save(utensil);
      }
    }
  };

  await insertEnumSet(Utensils, 'utensils');
  await insertEnumSet(Vessel, 'vessels');
  await insertEnumSet(ExtraVessels, 'extraVessels');
}

async function main() {
  await AppDataSource.initialize();

  await seedIngredientsFromEnums();
  await seedUtensils();

  process.exit(0);
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
