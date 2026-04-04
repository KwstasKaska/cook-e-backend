import AppDataSource from './app-data-source';
import { Ingredient } from './entities/Chef/Ingredient';
import { IngredientsCategory } from './entities/Chef/IngredientsCategory';
import { Utensil } from './entities/Chef/Utensil';
import * as IngredientsEnums from './utils/ingredients';

// ── Utensils

const UtensilsEL: Record<string, string> = {
  fork: 'Πιρούνι',
  knife: 'Μαχαίρι',
  spoon: 'Κουτάλι',
  ladle: 'Κουτάλα',
};
const UtensilsEN: Record<string, string> = {
  fork: 'Fork',
  knife: 'Knife',
  spoon: 'Spoon',
  ladle: 'Ladle',
};

const VesselEL: Record<string, string> = {
  pot: 'Κατσαρόλα',
  pan: 'Τηγάνι',
  wok: 'Γουόκ',
  oven: 'Φούρνος',
  steamer: 'Ατμομάγειρας',
  dutchOven: 'Γάστρα',
  pressureCooker: 'Χύτρα Ταχύτητας',
  airFryer: 'Φριτέζα Αέρα',
};
const VesselEN: Record<string, string> = {
  pot: 'Pot',
  pan: 'Pan',
  wok: 'Wok',
  oven: 'Oven',
  steamer: 'Steamer',
  dutchOven: 'Dutch Oven',
  pressureCooker: 'Pressure Cooker',
  airFryer: 'Air Fryer',
};

const ExtraVesselsEL: Record<string, string> = {
  grater: 'Τρίφτης',
  blender: 'Μπλέντερ',
  cuttingBoard: 'Ξύλο Κοπής',
};
const ExtraVesselsEN: Record<string, string> = {
  grater: 'Grater',
  blender: 'Blender',
  cuttingBoard: 'Cutting Board',
};

// ── Category mapping

const categoryNames = [
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

type CategoryKey = (typeof categoryNames)[number];

const categoryTranslations: Record<CategoryKey, { el: string; en: string }> = {
  Vegetables: { el: 'Λαχανικά', en: 'Vegetables' },
  Fruits: { el: 'Φρούτα', en: 'Fruits' },
  Grain: { el: 'Δημητριακά', en: 'Grains' },
  Dairy: { el: 'Γαλακτοκομικά', en: 'Dairy' },
  Meat: { el: 'Κρέας & Ψαρικά', en: 'Meat & Seafood' },
  Lipid: { el: 'Λίπη & Λιπαρά', en: 'Fats & Oils' },
  Legumes: { el: 'Όσπρια', en: 'Legumes' },
  Pastry: { el: 'Γλυκά & Σνακς', en: 'Sweets & Snacks' },
  Spices: { el: 'Μπαχαρικά', en: 'Spices & Herbs' },
};

// ── Seed functions ────────────────────────────────────────────────────────────

async function seedIngredients() {
  const ingredientRepo = AppDataSource.getRepository(Ingredient);
  const categoryRepo = AppDataSource.getRepository(IngredientsCategory);

  for (const categoryKey of categoryNames) {
    const { el, en } = categoryTranslations[categoryKey];

    let category = await categoryRepo.findOneBy({ name_en: en });

    if (!category) {
      category = categoryRepo.create({ name_el: el, name_en: en });
      await categoryRepo.save(category);
    }

    const elEnum = IngredientsEnums[categoryKey] as Record<string, string>;
    const enEnum = IngredientsEnums[
      `${categoryKey}EN` as keyof typeof IngredientsEnums
    ] as Record<string, string>;

    for (const key of Object.keys(elEnum)) {
      const name_el = elEnum[key];
      const name_en = enEnum?.[key] ?? name_el; // fallback to Greek if EN missing

      const exists = await ingredientRepo.findOneBy({ name_en });
      if (exists) continue;

      const ingredient = ingredientRepo.create({
        name_el,
        name_en,
        category,
        caloriesPer100g: 0,
      });
      await ingredientRepo.save(ingredient);
    }
  }
}

async function seedUtensils() {
  const repo = AppDataSource.getRepository(Utensil);

  const insertSet = async (
    elMap: Record<string, string>,
    enMap: Record<string, string>,
    category_el: string,
    category_en: string,
  ) => {
    for (const key of Object.keys(elMap)) {
      const name_en = enMap[key];
      const exists = await repo.findOneBy({ name_en });
      if (exists) continue;

      const utensil = repo.create({
        name_el: elMap[key],
        name_en,
        category_el,
        category_en,
      });
      await repo.save(utensil);
    }
  };

  await insertSet(UtensilsEL, UtensilsEN, 'Σκεύη', 'Utensils');
  await insertSet(VesselEL, VesselEN, 'Σκεύη Μαγειρέματος', 'Cooking Vessels');
  await insertSet(
    ExtraVesselsEL,
    ExtraVesselsEN,
    'Βοηθητικά',
    'Extra Equipment',
  );
}

async function main() {
  await AppDataSource.initialize();
  await seedIngredients();
  await seedUtensils();
  console.log('Seed complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
