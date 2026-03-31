import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateIngredientCategoryAndRelationship1645627891234
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert predefined categories
    await queryRunner.query(
      `INSERT INTO "ingredients_category" (id, name) VALUES
        (1, 'Vegetables'),
        (2, 'Fruits'),
        (3, 'Grain'),
        (4, 'Dairy'),
        (5, 'Meat'),
        (6, 'Lipid'),
        (7, 'Legumes'),
        (8, 'Pastry'),
        (9, 'Spices');`
    );
  }

  public async down(_: QueryRunner): Promise<void> {}
}
