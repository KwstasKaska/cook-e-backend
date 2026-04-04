import { Field, Float, Int, ObjectType, registerEnumType } from 'type-graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Step } from './Step';
import { RecipeIngredient } from './RecipeIngredient';
import { ChefProfile } from './ChefProfile';
import { Utensil } from './Utensil';
import { RecipeRating } from '../General/RecipeRating';
import { UserFavorite } from '../User/UserFavorite';
import { CookedRecipe } from '../User/CookedRecipe';

export enum Difficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  DIFFICULT = 'difficult',
}

export enum RecipeCategory {
  MEAT = 'Κρέας',
  LEGUMES = 'Όσπρια',
  SEAFOOD = 'Θαλασσινά',
  SALADS = 'Σαλάτες',
  PASTA = 'Ζυμαρικά',
  APPETIZERS = 'Ορεκτικά',
  VEGAN = 'Vegan',
}

registerEnumType(Difficulty, {
  name: 'Difficulty',
  description: 'The difficulty level of the food preparation',
});

registerEnumType(RecipeCategory, {
  name: 'RecipeCategory',
  description: 'The category of the recipe',
});

@ObjectType()
@Entity()
export class Recipe extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  // ── Translatable fields ────────────────────────────────────────────

  @Field(() => String)
  @Column()
  title_el: string;

  @Field(() => String)
  @Column()
  title_en: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  description_el?: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  description_en?: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  chefComment_el?: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  chefComment_en?: string;

  // ── Non-translatable fields ────────────────────────────────────────

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  recipeImage: string;

  @Field(() => Difficulty)
  @Column({ type: 'enum', enum: Difficulty, default: Difficulty.EASY })
  difficulty: Difficulty;

  @Field(() => Int)
  @Column({ type: 'int' })
  prepTime: number;

  @Field(() => Int)
  @Column({ type: 'int' })
  cookTime: number;

  @Field(() => Int, { nullable: true })
  @Column({ type: 'int', nullable: true })
  restTime?: number;

  // Free-text shown on recipe detail page e.g. "Ελληνική", "Ιταλική"
  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  foodEthnicity?: string;

  // Predefined category matching the UI filter tabs
  @Field(() => RecipeCategory, { nullable: true })
  @Column({ type: 'enum', enum: RecipeCategory, nullable: true })
  category?: RecipeCategory;

  // ── Macro / nutritional fields ─────────────────────────────────────

  @Field(() => Float, { nullable: true })
  @Column({ type: 'float', nullable: true })
  caloriesTotal?: number;

  @Field(() => Float, { nullable: true })
  @Column({ type: 'float', nullable: true })
  protein?: number;

  @Field(() => Float, { nullable: true })
  @Column({ type: 'float', nullable: true })
  carbs?: number;

  @Field(() => Float, { nullable: true })
  @Column({ type: 'float', nullable: true })
  fat?: number;

  // ── Relations ──────────────────────────────────────────────────────

  @OneToMany(
    () => RecipeIngredient,
    (recipeIngredient) => recipeIngredient.recipe,
  )
  recipeIngredients: RecipeIngredient[];

  @OneToMany(() => Step, (step) => step.recipe)
  steps: Step[];

  @ManyToOne(() => ChefProfile, (author) => author.recipes)
  author: ChefProfile;

  @Field()
  @Column()
  authorId: number;

  @ManyToMany(() => Utensil, (utensil) => utensil.recipes, { cascade: true })
  @JoinTable()
  utensils: Utensil[];

  @OneToMany(() => RecipeRating, (rating) => rating.recipe)
  ratings: RecipeRating[];

  @OneToMany(() => UserFavorite, (fav) => fav.recipe)
  favoritedBy: UserFavorite[];

  @OneToMany(() => CookedRecipe, (log) => log.recipe)
  cookedLogs: CookedRecipe[];

  @Field(() => String)
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
