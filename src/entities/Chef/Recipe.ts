import { Field, Int, ObjectType, registerEnumType } from 'type-graphql';
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

export enum Difficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  DIFFICULT = 'difficult',
}

registerEnumType(Difficulty, {
  name: 'Difficulty',
  description: 'The difficulty level of the food preparation',
});

@ObjectType()
@Entity()
export class Recipe extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => String)
  @Column()
  title: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  chefComment?: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  recipeImage: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  description?: string;

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

  @Field(() => String)
  @Column({ type: 'text', nullable: true })
  foodEthnicity: string;

  @Field(() => String)
  @Column({ type: 'text', nullable: true })
  foodEvent: string;

  @Field(() => Int, { nullable: true })
  @Column({ type: 'int', nullable: true })
  caloriesTotal?: number;

  // Relations

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

  @Field(() => String)
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
