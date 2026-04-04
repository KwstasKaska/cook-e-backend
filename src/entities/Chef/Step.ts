import { Field, ObjectType } from 'type-graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
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

  // ── Non-translatable fields ────────────────────────────────────────

  /* Αυτή η στήλη χρησιμοποιείται σαν μερικό (foreign) κλειδί —
     συσχέτιση με την οντότητα Recipe */
  @Field()
  @Column()
  recipeID: number;

  @ManyToOne(() => Recipe, (recipe) => recipe.steps)
  recipe: Recipe;

  @Field(() => String)
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
