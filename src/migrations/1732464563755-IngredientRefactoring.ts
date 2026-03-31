import { MigrationInterface, QueryRunner } from 'typeorm';

export class IngredientRefactoring1732464563755 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    type IngredientCategories = {
      Vegetables: number;
      Fruits: number;
      Grain: number;
      Dairy: number;
      Meat: number;
      Lipid: number;
      Legumes: number;
      Pastry: number;
      Spices: number;
    };

    type Ingredients = {
      [K in keyof IngredientCategories]: string[]; // This iterates through each key in the union 'Vegetables' | 'Fruits' | 'Spices'
    };

    // Mapping categories to ingredientCategoryId
    const categories: IngredientCategories = {
      Vegetables: 1,
      Fruits: 2,
      Grain: 3,
      Dairy: 4,
      Meat: 5,
      Lipid: 6,
      Legumes: 7,
      Pastry: 8,
      Spices: 9,
    };

    const ingredients: Ingredients = {
      Vegetables: [
        'Καρότο',
        'Μπρόκολο',
        'Κουνουπίδι',
        'Σπανάκι',
        'Λάχανο',
        'Κρεμμύδι',
        'Σκόρδο',
        'Πιπεριά',
        'Τομάτα',
        'Αγγούρι',
        'Μελιτζάνα',
        'Φασολάκια',
        'Πατάτα',
        'Κολοκυθάκια',
        'Ραπανάκι',
        'Μαρούλι',
        'Αγγινάρα',
        'Μανιτάρια',
        'Πράσο',
        'Σέλινο',
      ],
      Fruits: [
        'Λεμόνι',
        'Πορτοκάλι',
        'Πορτοκάλι γλυκό',
        'Φράουλα',
        'Βατόμουρο',
        'Μύρτιλο',
        'Ροδάκινο',
        'Βερίκοκο',
        'Κεράσι',
        'Μπανάνα',
        'Ανανάς',
        'Μάνγκο',
        'Καρπούζι',
        'Μήλο',
        'Άχλαδι',
        'Ρόδι',
        'Σύκο',
        'Κράνμπερι',
        'Σταφίδες',
      ],
      Grain: [
        'Κριθάρι',
        'Ρύζι',
        'Καλαμπόκι',
        'Βρώμη',
        'Κινόα',
        'Κούσκους',
        'Αμάρανθος',
        'Δημητριακά',
        'Αλεύρι',
        'Ψωμί',
        'Ζυμαρικά',
      ],
      Dairy: [
        'Φέτα',
        'Κεφαλοτύρι',
        'Μυζήθρα',
        'Γραβιέρα',
        'Ανθότυρο',
        'Κασέρι',
        'Ελληνικό Γιαούρτι',
        'Τζατζίκι',
        'Γάλα',
        'Βούτυρο',
        'Κρέμα Γάλακτος',
      ],
      Meat: [
        'Αρνί',
        'Μοσχάρι',
        'Χοιρινό',
        'Κοτόπουλο',
        'Μοσχαρίσιο',
        'Κουνέλι',
        'Κατσίκι',
        'Αγριογούρουνο',
        'Πάπια',
        'Πέρδικα',
        'Γαλοπούλα',
        'Χταπόδι',
        'Καλαμάρι',
        'Σαρδέλες',
        'Γαύρος',
        'Σκουμπρί',
        'Μπακαλιάρος',
        'Λαβράκι',
        'Τόνος',
        'Γαρίδες',
        'Μύδια',
      ],
      Lipid: [
        'Λάδι Ελιάς',
        'Λάδι Φυτικό',
        'Λάδι Ηλίου',
        'Λάδι Σουσαμιού',
        'Βούτυρο',
        'Καθαρισμένο Βούτυρο (Γκι)',
        'Ταχίνι',
      ],
      Legumes: [
        'Φακές',
        'Ρεβύθια',
        'Κουκιά',
        'Μαυρομάτικα',
        'Φασόλια Τρεμοπούλι',
        'Φασόλια Γίγαντες',
        'Αρακάς',
        'Φακή Κίτρινη Χωριστή',
        'Κουρκουτιά',
      ],
      Pastry: ['Ζάχαρη', 'Μέλι', 'Σοκολάτα', 'Τρούφες'],
      Spices: [
        'Ρίγανη',
        'Θυμάρι',
        'Δεντρολίβανο',
        'Άνηθο',
        'Βασιλικός',
        'Κανέλα',
        'Μαϊντανός',
        'Κορίανδρος',
        'Ξύλο Καυτερής Πιπεριάς',
        'Πάπρικα',
        'Κύμινο',
        'Φύλλα Δάφνης',
        'ξερό δυόσμο',
      ],
    };

    for (const category in categories) {
      // Ensure TypeScript understands `category` is a key of IngredientCategories
      const typedCategory = category as keyof IngredientCategories;

      const ingredientCategoryId = categories[typedCategory]; // Safely get the category ID
      const ingredientNames = ingredients[typedCategory]; // Safely get the ingredient names

      for (const name of ingredientNames) {
        await queryRunner.query(
          `INSERT INTO Ingredient (name, "ingredientCategoryId") VALUES ($1, $2)`,
          [name, ingredientCategoryId]
        );
      }
    }
  }

  public async down(_: QueryRunner): Promise<void> {}
}
