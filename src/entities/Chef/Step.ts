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

  @Field(() => String)
  @Column({ type: 'text' })
  body: string;

  /* Στης προκειμένη αυτή η στήλη χρησιμοποιείται σαν μερικό(foreign) κλειδί καθώς πρέπει να υπάρξει συσχέτιση με την οντότητα Recipe */
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
