import { Field, ObjectType } from 'type-graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Recipe } from './Recipe';

@ObjectType()
@Entity()
export class Step extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  // ── Translatable fields ────────────────────────────────────────────

  @Field(() => String)
  @Column({ type: 'text' })
  body_el: string;

  @Field(() => String)
  @Column({ type: 'text' })
  body_en: string;

  // ── Foreign key — always required ──────────────────────────────────

  @Field()
  @Column({ nullable: false })
  recipeID: number;

  @ManyToOne(() => Recipe, (recipe) => recipe.steps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipeID' })
  recipe: Recipe;

  @Field(() => String)
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
